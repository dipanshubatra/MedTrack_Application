package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentOrder;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.repository.EquipmentOrderRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.supplier.security.SupplierAccessGuard;
import com.medtrack.util.PurchaseOrderPdf;
import com.medtrack.dto.PlaceOrderRequest;
import com.medtrack.dto.SupplierMetricsDto;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.medtrack.exception.ResourceNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.medtrack.util.SupplierInvoicePdf;
import com.medtrack.auth.service.EmailService;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final EquipmentOrderRepository orderRepository;
    private final EquipmentRepository equipmentRepository;
    private final PurchaseOrderPdf purchaseOrderPdf;
    private final SupplierInvoicePdf supplierInvoicePdf;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final SupplierAccessGuard supplierAccessGuard;

    public byte[] generateInvoicePdf(Long id) {
        EquipmentOrder order = getOrderById(id);
        return supplierInvoicePdf.generate(order);
    }

    public void emailInvoice(Long id) {
        EquipmentOrder order = getOrderById(id);
        byte[] pdf = supplierInvoicePdf.generate(order);
        String recipient = order.getCreatedBy();
        if (recipient == null || recipient.trim().isEmpty()) {
            recipient = "admin@hospital.com";
        }
        emailService.sendInvoiceEmail(recipient, order.getOrderCode(), pdf);
    }


    private String getCurrentUserOrganization() {
        return getCurrentHospitalUser().getOrganization();
    }

    /**
     * The authenticated hospital user, resolved once for both identities an order may carry.
     *
     * <p>{@code EquipmentOrder.hospital} is free text and the application writes two different
     * things into it: {@link #placeOrder} writes {@code User.organization}, while
     * {@code ProcurementService.acceptQuote} writes the {@code Hospital} profile name. Nothing ties
     * those two strings together, so filtering on the organisation alone - which is what every read
     * here used to do - hid every order the procurement flow created for the very hospital that
     * raised the request. The repository matches both, which needs the caller's email as well as
     * their organisation.</p>
     */
    private User getCurrentHospitalUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean isSupplier() {
        return isSupplier(getCurrentAuthentication());
    }

    private Authentication getCurrentAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return authentication;
    }

    private EquipmentOrder getSupplierOrderById(Long id, Authentication authentication) {
        Long supplierId = supplierAccessGuard.resolveCallerId(authentication);
        return orderRepository.findByIdAndSupplierId(id, supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    private boolean isSupplier(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SUPPLIER".equals(authority.getAuthority()));
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        return authentication.getName();
    }

    /**
     * Returns one page of orders visible to the caller.
     *
     * <p>Suppliers see only orders assigned to them through a shipment record; a hospital user
     * sees only their own organisation's orders.
     * The {@code Pageable} is required: {@link com.medtrack.controller.OrderController} supplies a
     * {@code @PageableDefault}, so callers never have to construct one themselves.</p>
     *
     * @param pageable the page to fetch; must not be {@code null}
     * @return the requested page of orders
     */
    public Page<EquipmentOrder> getAllOrders(Pageable pageable) {
        if (pageable == null) {
            throw new IllegalArgumentException("Pageable is required");
        }
        if (isSupplier()) {
            Long supplierId = supplierAccessGuard.resolveCallerId(getCurrentAuthentication());
            return orderRepository.findBySupplierId(supplierId, pageable);
        }
        User caller = getCurrentHospitalUser();
        return orderRepository.findVisibleToHospitalUser(
                caller.getOrganization(), caller.getEmail(), pageable);
    }

    /**
     * Returns every order visible to the caller, unpaged.
     *
     * <p>Kept separate from {@link #getAllOrders(Pageable)} because the supplier scorecard has to
     * aggregate over the caller's whole order history. Paging that call would have computed the
     * on-time rate from whichever page happened to be requested.</p>
     *
     * @return all orders the caller may see
     */
    public List<EquipmentOrder> getAllOrdersUnpaged() {
        if (isSupplier()) {
            Long supplierId = supplierAccessGuard.resolveCallerId(getCurrentAuthentication());
            return orderRepository.findBySupplierId(supplierId);
        }
        User caller = getCurrentHospitalUser();
        return orderRepository.findVisibleToHospitalUser(caller.getOrganization(), caller.getEmail());
    }

    public EquipmentOrder getOrderById(Long id) {
        if (isSupplier()) {
            return getSupplierOrderById(id, getCurrentAuthentication());
        }
        User caller = getCurrentHospitalUser();
        // Scoped in the query rather than loaded and then compared, so an order belonging to
        // another hospital is indistinguishable from an id that does not exist.
        return orderRepository.findVisibleToHospitalUserById(
                        id, caller.getOrganization(), caller.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public EquipmentOrder placeOrder(PlaceOrderRequest request, Authentication authentication) {
        User hospitalUser = getAuthenticatedUser(authentication);
        if (hospitalUser.getOrganization() == null || hospitalUser.getOrganization().isBlank()) {
            throw new IllegalArgumentException("Authenticated user has no hospital organization on record");
        }

        Equipment equipment = equipmentRepository.findByEquipmentCode(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found with code: " + request.getEquipmentId()));
        if (equipment.getStatus() == EquipmentStatus.RETIRED || equipment.getStatus() == EquipmentStatus.DISPOSED) {
            throw new IllegalArgumentException("Retired or disposed equipment cannot be ordered as active stock");
        }

        EquipmentOrder order = EquipmentOrder.builder()
                .orderCode("ORD-" + java.util.UUID.randomUUID())
                .equipmentId(equipment.getEquipmentCode())
                .equipmentName(equipment.getName())
                .quantity(request.getQuantity())
                .notes(request.getNotes())
                .hospital(hospitalUser.getOrganization())
                .createdBy(hospitalUser.getName() != null ? hospitalUser.getName() : hospitalUser.getEmail())
                .build();

        return orderRepository.save(order);
    }

    public EquipmentOrder updateOrderStatus(Long id, String status, String supplierNotes,
                                             Authentication authentication) {
        if (!isSupplier(authentication)) {
            throw new AccessDeniedException("Only suppliers may update order status");
        }
        EquipmentOrder order = getSupplierOrderById(id, authentication);

        order.setStatus(status);
        order.setShippingStatus(status);
        order.setSupplierNotes(supplierNotes);
        order.setUpdatedAt(LocalDateTime.now());

        if ("Shipped".equalsIgnoreCase(status) || "Dispatched".equalsIgnoreCase(status)) {
            order.setDispatchedAt(LocalDateTime.now());
            if (order.getTrackingNo() == null) {
                order.setTrackingNo("TRK-" + (new SecureRandom().nextInt(900000) + 100000));
            }
            if (order.getCarrier() == null) {
                order.setCarrier("MedExpress Logistics");
            }
        } else if ("Delivered".equalsIgnoreCase(status)) {
            if (order.getDispatchedAt() == null) {
                order.setDispatchedAt(LocalDateTime.now().minusDays(2)); // baseline fallback
            }
            order.setDeliveredAt(LocalDateTime.now());
        }
        
        return orderRepository.save(order);
    }

    public byte[] generatePurchaseOrderPdf(Long id) {
        EquipmentOrder order = getOrderById(id);
        return purchaseOrderPdf.generate(order);
    }

    public void deleteOrder(Long id) {
        EquipmentOrder order = getOrderById(id);
        orderRepository.delete(order);
    }

    /**
     * Archives (soft deletes) an order by setting deleted = true.
     * This is used instead of hard delete for audit compliance.
     */
    @Transactional
    public EquipmentOrder archiveOrder(Long id, String deletedBy) {
        EquipmentOrder order = getOrderById(id);

        order.setDeleted(true);
        order.setDeletedAt(LocalDateTime.now());
        order.setDeletedBy(deletedBy);

        EquipmentOrder savedOrder = orderRepository.save(order);

        log.info("Order archived | user={} | hospital={} | orderId={} | orderCode={}",
                deletedBy, order.getHospital(), id, order.getOrderCode());

        return savedOrder;
    }

    /**
     * Restores an archived order belonging to the caller's hospital.
     *
     * <p>Only available within 90 days of archival. An archived order owned by another hospital is
     * reported as not found rather than as forbidden, so the endpoint cannot be used to find out
     * which order ids exist.</p>
     */
    @Transactional
    public EquipmentOrder restoreOrder(Long id, String username) {
        EquipmentOrder order = getArchivedOrderForCaller(id);

        // Check if 90 days have passed since archival
        if (order.getDeletedAt() != null && order.getDeletedAt().isBefore(LocalDateTime.now().minusDays(90))) {
            throw new IllegalStateException("Order cannot be restored after 90 days");
        }

        order.setDeleted(false);
        order.setDeletedAt(null);
        order.setDeletedBy(null);

        EquipmentOrder savedOrder = orderRepository.save(order);

        log.info("Order restored | user={} | hospital={} | orderId={} | orderCode={}",
                username, order.getHospital(), id, order.getOrderCode());

        return savedOrder;
    }

    /**
     * Gets paginated archived orders visible to the caller.
     *
     * <p>A hospital sees its own archive; a supplier sees only the archived orders they are
     * assigned to through a shipment record, matching how {@link #getAllOrders(Pageable)} scopes
     * the live listing.</p>
     */
    public Page<EquipmentOrder> getArchivedOrders(Pageable pageable) {
        if (isSupplier()) {
            Long supplierId = supplierAccessGuard.resolveCallerId(getCurrentAuthentication());
            return orderRepository.findBySupplierIdAndDeletedTrue(supplierId, pageable);
        }
        return orderRepository.findByHospitalAndDeletedTrue(getCurrentUserOrganization(), pageable);
    }

    /**
     * Permanently deletes an archived order belonging to the caller's hospital.
     * Only callable after 90 days from archival.
     */
    @Transactional
    public void permanentlyDeleteOrder(Long id) {
        EquipmentOrder order = getArchivedOrderForCaller(id);

        // Check if 90 days have passed since archival
        if (order.getDeletedAt() != null && order.getDeletedAt().isAfter(LocalDateTime.now().minusDays(90))) {
            throw new IllegalStateException("Order cannot be permanently deleted until 90 days after archival");
        }

        orderRepository.delete(order);

        log.info("Order permanently deleted | user={} | hospital={} | orderId={} | orderCode={}",
                getCurrentUsername(), order.getHospital(), id, order.getOrderCode());
    }

    /**
     * Resolves one archived order the caller is allowed to act on.
     *
     * <p>The archive queries are native - {@link EquipmentOrder} carries a class-level
     * {@code @SQLRestriction("deleted = false")} that would otherwise hide every archived row - and
     * a native query gets no tenant handling from Hibernate. Restore and permanent delete both went
     * through {@code findByIdAndDeletedTrue(id)}, which scoped on nothing at all, so any hospital
     * account could restore or purge any other hospital's archived order by id. Suppliers have no
     * archive administration at all: the controller restricts both endpoints to {@code ROLE_HOSPITAL}
     * and this method refuses a supplier caller rather than relying on that alone.</p>
     */
    private EquipmentOrder getArchivedOrderForCaller(Long id) {
        if (isSupplier()) {
            throw new AccessDeniedException("Suppliers cannot administer the hospital order archive");
        }
        String hospital = getCurrentUserOrganization();
        return orderRepository.findByIdAndHospitalAndDeletedTrue(id, hospital)
                .orElseThrow(() -> new ResourceNotFoundException("Archived order not found"));
    }

    public SupplierMetricsDto getSupplierMetrics() {
        List<EquipmentOrder> orders = getAllOrdersUnpaged();
        long total = orders.size();
        
        long pending = orders.stream()
                .filter(o -> !"Delivered".equalsIgnoreCase(o.getShippingStatus()))
                .count();
        
        long shipped = orders.stream()
                .filter(o -> "Shipped".equalsIgnoreCase(o.getShippingStatus()))
                .count();
        
        long delivered = orders.stream()
                .filter(o -> "Delivered".equalsIgnoreCase(o.getShippingStatus()))
                .count();

        // Calculate average delivery time in days for all delivered orders
        double avgDays = orders.stream()
                .filter(o -> "Delivered".equalsIgnoreCase(o.getShippingStatus()) 
                        && o.getOrderDate() != null 
                        && o.getDeliveredAt() != null)
                .mapToLong(o -> ChronoUnit.DAYS.between(o.getOrderDate(), o.getDeliveredAt()))
                .average()
                .orElse(0.0);

        // Benchmark SLA: Deliver within 7 days is on-time
        long deliveredCount = orders.stream()
                .filter(o -> "Delivered".equalsIgnoreCase(o.getShippingStatus()))
                .count();

        long onTimeCount = orders.stream()
                .filter(o -> "Delivered".equalsIgnoreCase(o.getShippingStatus())
                        && o.getOrderDate() != null 
                        && o.getDeliveredAt() != null
                        && ChronoUnit.DAYS.between(o.getOrderDate(), o.getDeliveredAt()) <= 7)
                .count();

        double onTimeRate = deliveredCount > 0 
                ? (double) onTimeCount * 100.0 / deliveredCount 
                : 100.0; // default to 100% if no orders delivered yet

        // Round average days and onTimeRate to 1 decimal place
        avgDays = Math.round(avgDays * 10.0) / 10.0;
        onTimeRate = Math.round(onTimeRate * 10.0) / 10.0;

        return SupplierMetricsDto.builder()
                .totalOrders(total)
                .pendingOrders(pending)
                .shippedOrders(shipped)
                .deliveredOrders(delivered)
                .averageDeliveryDays(avgDays)
                .onTimeRate(onTimeRate)
                .build();
    }
}
