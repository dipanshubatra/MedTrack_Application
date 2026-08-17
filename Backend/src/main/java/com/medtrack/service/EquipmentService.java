package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentDashboardResponse;
import com.medtrack.dto.EquipmentImportPreviewResponse;
import com.medtrack.dto.EquipmentImportSummary;
import com.medtrack.dto.EquipmentStatisticsResponse;
import com.medtrack.dto.EquipmentValuationResponse;
import com.medtrack.dto.LowStockSummaryResponse;
import com.medtrack.dto.StockAdjustmentRequest;
import com.medtrack.dto.WarrantySummaryResponse;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentImportAuditLog;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.FacilityLocation;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.model.WarrantyCoverageType;
import com.medtrack.repository.EquipmentImportAuditLogRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.FacilityLocationRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.specifications.EquipmentSpecifications;
import com.medtrack.util.CsvSupport;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.medtrack.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import com.medtrack.model.EquipmentCategory;
import com.medtrack.dto.EquipmentUtilizationResponse;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service layer for Equipment-related business logic.
 * Handles CRUD operations, CSV bulk uploads, and asset QR code generation.
 */
@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final EquipmentImportAuditLogRepository equipmentImportAuditLogRepository;
    private final FacilityLocationRepository facilityLocationRepository;
    private final EventPublisherService eventPublisherService;
    private final EquipmentAuditService equipmentAuditService;
    private final EquipmentCsvService equipmentCsvService;
    private final EquipmentStatisticsService equipmentStatisticsService;
    private final EquipmentQrCodeService equipmentQrCodeService;

    private static final Logger logger = LoggerFactory.getLogger(EquipmentService.class);


    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    public EquipmentDashboardResponse getDashboardOverview(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getDashboardOverview(username, hospital);
    }

    /**
     * Every equipment record belonging to the caller's hospital, unpaged.
     *
     * <p>Retained next to the paged overload for the callers that genuinely need the whole
     * inventory in one pass - the CSV export and the aggregate reports - where handing back a
     * single page would silently produce a partial answer rather than a smaller one.</p>
     *
     * @param username authenticated user's username
     * @return the hospital's full inventory
     */
    public List<Equipment> getAllEquipment(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByHospitalId(hospital.getId());
    }

    /**
     * Fetches one page of the caller's equipment records.
     *
     * @param username authenticated user's username
     * @param locationId optional facility-location node; when set, only assets placed at that
     *                   node or any of its descendants are returned (issue #745)
     * @param pageable the page to fetch
     * @return the requested page of equipment
     */
    public Page<Equipment> getAllEquipment(String username, Long locationId, Pageable pageable) {
        Hospital hospital = getHospitalForUser(username);
        if (locationId != null) {
            return equipmentRepository.findByHospitalIdAndLocationIn(
                    hospital.getId(),
                    resolveLocationSubtree(locationId, hospital.getId()),
                    pageable);
        }
        return equipmentRepository.findByHospitalId(hospital.getId(), pageable);
    }

    /**
     * The selected node plus every descendant, so filtering on a floor or facility also matches
     * assets in the rooms beneath it.
     */
    private Set<Long> resolveLocationSubtree(Long rootId, Long hospitalId) {
        List<FacilityLocation> all = facilityLocationRepository.findByHospitalId(hospitalId);
        boolean rootExistsInHospital = all.stream().anyMatch(loc -> loc.getId().equals(rootId));
        if (!rootExistsInHospital) {
            throw new ResourceNotFoundException("Facility location not found with ID: " + rootId);
        }
        Set<Long> ids = new HashSet<>();
        Set<Long> pending = new HashSet<>();
        pending.add(rootId);
        while (!pending.isEmpty()) {
            Set<Long> next = new HashSet<>();
            for (Long parent : pending) {
                for (FacilityLocation location : all) {
                    if (parent.equals(location.getParentId())) {
                        ids.add(location.getId());
                        next.add(location.getId());
                    }
                }
            }
            pending = next;
        }
        ids.add(rootId);
        return ids;
    }

    public List<Equipment> getEquipmentByDepartment(String department, String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByHospitalIdAndDepartmentIgnoreCase(
                hospital.getId(),
                department
        );
    }

    public List<Equipment> getLowStockEquipment(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findLowStockEquipment(hospital.getId());
    }

    /**
     * Applies a signed stock movement to one asset owned by the caller's hospital.
     *
     * <p>Expressed as a delta rather than an absolute quantity so that two concurrent movements
     * compose instead of overwriting each other. The row is re-read inside the transaction and the
     * resulting quantity is validated before the write, so stock can never go negative.</p>
     *
     * @param id       equipment identifier, scoped to the caller's hospital
     * @param request  the movement to apply
     * @param username authenticated user's username
     * @return the updated equipment record
     * @throws ResourceNotFoundException if the asset does not exist or belongs to another hospital
     * @throws IllegalArgumentException  if the delta is zero, or would drive quantity negative
     */
    @Transactional
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public Equipment adjustStock(Long id, StockAdjustmentRequest request, String username) {
        if (request == null || request.getDelta() == null) {
            throw new IllegalArgumentException("Stock delta is required");
        }
        if (request.getDelta() == 0) {
            throw new IllegalArgumentException("Stock delta must not be zero");
        }
        if (request.getMinimumStock() != null && request.getMinimumStock() < 0) {
            throw new IllegalArgumentException("Minimum stock cannot be negative");
        }

        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found or you don't have access"));

        int currentQuantity = equipment.getQuantity() != null ? equipment.getQuantity() : 0;
        long adjusted = (long) currentQuantity + request.getDelta();

        if (adjusted < 0) {
            throw new IllegalArgumentException(
                    "Insufficient stock: cannot remove " + Math.abs(request.getDelta())
                            + " unit(s) from a quantity of " + currentQuantity);
        }
        // Guard the upper bound too. A caller sending Integer.MAX_VALUE as the delta would
        // otherwise silently overflow the column on narrowing back to int.
        if (adjusted > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Resulting quantity exceeds the supported maximum");
        }

        equipment.setQuantity((int) adjusted);
        if (request.getMinimumStock() != null) {
            equipment.setMinimumStock(request.getMinimumStock());
        }

        int minimumStock = equipment.getMinimumStock() != null ? equipment.getMinimumStock() : 0;
        boolean crossedIntoLowStock = currentQuantity > minimumStock && (int) adjusted <= minimumStock;

        Equipment savedEquipment = equipmentRepository.save(equipment);

        if (crossedIntoLowStock) {
            publishLowStockEvent(savedEquipment, minimumStock);
        }

        logger.info(
                "Equipment stock adjusted | User: {} | Equipment ID: {} | Delta: {} | "
                        + "Quantity: {} -> {} | Reason: {}",
                username,
                savedEquipment.getId(),
                request.getDelta(),
                currentQuantity,
                savedEquipment.getQuantity(),
                request.getReason() != null ? request.getReason() : "not supplied"
        );

        return savedEquipment;
    }

    /**
     * Raises an {@code EQUIPMENT_LOW_STOCK} operations event the moment a stock adjustment
     * drives quantity down to or below the minimum threshold. Fired only on the crossing
     * (see the caller), so repeated adjustments while already low do not spam the feed.
     */
    private void publishLowStockEvent(Equipment equipment, int minimumStock) {
        if (equipment.getHospital() == null) {
            return;
        }
        String title = equipment.getQuantity() == 0
                ? "Out of stock: " + equipment.getName()
                : "Low stock: " + equipment.getName();
        String detail = "{"
                + "\"equipmentCode\":\"" + escapeJsonString(equipment.getEquipmentCode()) + "\","
                + "\"quantity\":" + equipment.getQuantity() + ","
                + "\"minimumStock\":" + minimumStock
                + "}";
        OperationsEvent.EventSeverity severity = equipment.getQuantity() == 0
                ? OperationsEvent.EventSeverity.CRITICAL
                : OperationsEvent.EventSeverity.WARNING;

        eventPublisherService.publishEvent(
                equipment.getHospital().getId(),
                OperationsEvent.EventCategory.EQUIPMENT,
                OperationsEvent.EventType.EQUIPMENT_LOW_STOCK,
                title,
                detail,
                equipment.getId(),
                OperationsEvent.EntityType.EQUIPMENT,
                "system",
                severity);
    }

    private String escapeJsonString(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    public EquipmentUtilizationResponse getEquipmentUtilization(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getEquipmentUtilization(hospital);
    }

    public LowStockSummaryResponse getLowStockSummary(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getLowStockSummary(hospital);
    }

    public Map<EquipmentStatus, Long> getEquipmentStatusSummary(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getEquipmentStatusSummary(hospital);
    }

    /**
     * Retrieves all equipment whose warranty has already expired.
     *
     * @param username authenticated user's username
     * @return list of equipment with expired warranties
     */
    public List<Equipment> getExpiredWarrantyEquipment(String username) {
        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();

        return equipmentRepository.findByHospitalIdAndWarrantyExpiryBefore(
                hospital.getId(),
                today
        );
    }

    public List<Equipment> getEquipmentByPurchaseDateRange(
            String username,
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Start date cannot be after end date."
            );
        }

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findByHospitalIdAndPurchaseDateBetween(
                hospital.getId(),
                startDate,
                endDate
        );
    }



    public Map<String, Long> getCategorySummary(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getCategorySummary(hospital);
    }


    public WarrantySummaryResponse getWarrantySummary(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getWarrantySummary(hospital);
    }

    public Map<String, Long> getEquipmentAgeSummary(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getEquipmentAgeSummary(hospital);
    }

    /**
     * Retrieves all equipment whose warranty will expire within the next 30 days.
     *
     * @param username authenticated user's username
     * @return list of equipment with warranties expiring soon
     */
    public List<Equipment> getWarrantyExpiringSoon(String username) {
        Hospital hospital = getHospitalForUser(username);
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(30);

        return equipmentRepository.findByHospitalIdAndWarrantyExpiryBetween(
                hospital.getId(),
                today,
                threshold
        );
    }

    /**
     * Fetches a single equipment record by its database ID.
     * Used for equipment detail views.
     * Throws a ResourceNotFoundException if no equipment exists with the given ID.
     */
    public Equipment getEquipmentById(Long id , String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByIdAndHospitalId(id,hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));
    }

    /**
     * Free-text search across the caller's inventory.
     *
     * <p>Matches the keyword as a case-insensitive substring of the asset name, model, serial
     * number, equipment code or department. Results are always scoped to the authenticated user's
     * hospital.</p>
     *
     * @param keyword  substring to look for; must not be blank
     * @param username authenticated user's username
     * @return matching equipment, ordered by name
     * @throws IllegalArgumentException if the keyword is null or blank
     */
    public List<Equipment> searchEquipment(String keyword, String username) {
        // A blank keyword degrades to "match everything", which is what GET /api/equipment already
        // does. Rejecting it stops an accidentally-empty search box from pulling the entire
        // inventory on every keystroke.
        if (keyword == null || keyword.isBlank()) {
            throw new IllegalArgumentException("Search keyword must not be blank");
        }

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findAll(
                EquipmentSpecifications.keywordMatches(hospital.getId(), keyword),
                Sort.by(Sort.Direction.ASC, "name"));
    }

    /**
     * Retrieves the caller's equipment narrowed by any combination of optional filters.
     *
     * <p>Every filter is optional; omitting all of them returns the hospital's full inventory. The
     * hospital predicate is applied by the specification regardless, so no filter combination can
     * reach another hospital's assets.</p>
     *
     * @param username   authenticated user's username
     * @param department exact department name, matched case-insensitively
     * @param category   equipment category
     * @param status     lifecycle status
     * @param model      case-insensitive substring of the model name
     * @return matching equipment, ordered by name
     */
    public List<Equipment> filterEquipment(
            String username,
            String department,
            EquipmentCategory category,
            EquipmentStatus status,
            String model) {

        Hospital hospital = getHospitalForUser(username);

        return equipmentRepository.findAll(
                EquipmentSpecifications.filterEquipment(
                        hospital.getId(), department, category, status, model),
                Sort.by(Sort.Direction.ASC, "name"));
    }

    public EquipmentStatisticsResponse getEquipmentStatistics(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getEquipmentStatistics(hospital);
    }

    public EquipmentValuationResponse getEquipmentValuation(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentStatisticsService.getEquipmentValuation(hospital);
    }

    /**
     * Adds a new equipment record.
     * If no equipmentCode is provided by the caller, auto-generates one
     * using a unique UUID.
     */
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public Equipment addEquipment(Equipment equipment , String username) {
        Hospital hospital = getHospitalForUser(username);
        equipment.setHospital(hospital);

        // Structured location (issue #745): the client sends locationId, which binds to the
        // read-only column projection. The managed node is resolved here so a raw id can never
        // point outside the caller's hospital.
        equipment.setLocation(resolveLocation(equipment, hospital));

        // Generate a simple code if not provided
        if (equipment.getEquipmentCode() == null) {
            equipment.setEquipmentCode("EQ-" + UUID.randomUUID().toString());
        }
        if (equipment.getQuantity() == null) {
            equipment.setQuantity(0);
        }

        if (equipment.getMinimumStock() == null) {
            equipment.setMinimumStock(10);
        }

        // Straight-line depreciation is the documented default. Jackson + Lombok builds the
        // entity from the request body field by field, so @Builder.Default does not apply on
        // deserialisation - the default must be applied here.
        if (equipment.getDepreciationMethod() == null) {
            equipment.setDepreciationMethod(DepreciationMethod.STRAIGHT_LINE);
        }

        if (equipment.getPurchaseCost() != null && equipment.getPurchaseCost().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Purchase cost cannot be negative");
        }

        if (equipment.getEquipmentCode() != null && !equipment.getEquipmentCode().isBlank() &&
                equipmentRepository.findByHospitalIdAndEquipmentCode(hospital.getId(), equipment.getEquipmentCode().trim()).isPresent()) {
            throw new IllegalArgumentException("Equipment Code already exists.");
        }

        if (equipment.getSerialNumber() != null && !equipment.getSerialNumber().isBlank() &&
                equipmentRepository.findByHospitalIdAndSerialNumber(hospital.getId(), equipment.getSerialNumber().trim()).isPresent()) {
            throw new IllegalArgumentException("Serial Number already exists.");
        }

        Equipment savedEquipment = equipmentRepository.save(equipment);

        logger.info(
                "Equipment created | User: {} | Equipment ID: {} | Name: {}",
                username,
                savedEquipment.getId(),
                savedEquipment.getName()
        );

        return savedEquipment;
    }

    /**
     * Resolves the incoming {@code locationId} to a managed node of the caller's hospital, or
     * {@code null} when no location was supplied.
     */
    private FacilityLocation resolveLocation(Equipment source, Hospital hospital) {
        Long locationId = source.getLocationId();
        if (locationId == null) {
            return null;
        }
        FacilityLocation location = facilityLocationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        if (!location.getHospital().getId().equals(hospital.getId())) {
            throw new ResourceNotFoundException("Location not found or you don't have access");
        }
        return location;
    }

    /**
     * Deletes an equipment record by ID.
     */
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public void deleteEquipment(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElse(null);
                
        if (equipment == null) {
            if (equipmentRepository.findByIdAndDeletedTrue(id).isPresent()) {
                return; // Idempotent success
            }
            throw new ResourceNotFoundException("Equipment not found or you don't have access");
        }

        logger.info(
                "Equipment deleted | User: {} | Equipment ID: {} | Name: {}",
                username, equipment.getId(), equipment.getName()
        );

        equipment.setDeleted(true);
        equipment.setDeletedAt(LocalDateTime.now());
        equipment.setDeletedBy(username);
        equipmentRepository.save(equipment);
    }

    /**
     * Updates an existing equipment record's fields.
     */
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public Equipment updateEquipment(Long id, Equipment equipmentDetails , String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id,hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));

        if (equipmentDetails.getEquipmentCode() != null && !equipmentDetails.getEquipmentCode().isBlank()) {
            String trimmedCode = equipmentDetails.getEquipmentCode().trim();
            equipmentRepository.findByHospitalIdAndEquipmentCode(hospital.getId(), trimmedCode)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Equipment Code already exists.");
                        }
                    });
        }

        if (equipmentDetails.getSerialNumber() != null && !equipmentDetails.getSerialNumber().isBlank()) {
            String trimmedSerial = equipmentDetails.getSerialNumber().trim();
            equipmentRepository.findByHospitalIdAndSerialNumber(hospital.getId(), trimmedSerial)
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            throw new IllegalArgumentException("Serial Number already exists.");
                        }
                    });
        }

        equipment.setName(equipmentDetails.getName());
        equipment.setModel(equipmentDetails.getModel());
        equipment.setSerialNumber(equipmentDetails.getSerialNumber());
        equipment.setDepartment(equipmentDetails.getDepartment());
        equipment.setCategory(equipmentDetails.getCategory());
        // Stock levels are moved through adjustStock, which applies a signed delta. A general
        // update must therefore treat an omitted value as "leave alone" rather than as zero,
        // otherwise any PUT that does not restate the inventory wipes it.
        if (equipmentDetails.getQuantity() != null) {
            equipment.setQuantity(equipmentDetails.getQuantity());
        }
        if (equipmentDetails.getMinimumStock() != null) {
            equipment.setMinimumStock(equipmentDetails.getMinimumStock());
        }
        equipment.setStatus(equipmentDetails.getStatus());
        equipment.setPurchaseDate(equipmentDetails.getPurchaseDate());
        // Finance fields follow the same "omitted means leave alone" rule as stock levels, so an
        // update that does not restate them cannot wipe the cost or useful life.
        if (equipmentDetails.getPurchaseCost() != null) {
            equipment.setPurchaseCost(equipmentDetails.getPurchaseCost());
        }
        if (equipmentDetails.getUsefulLifeYears() != null) {
            equipment.setUsefulLifeYears(equipmentDetails.getUsefulLifeYears());
        }
        if (equipmentDetails.getDepreciationMethod() != null) {
            equipment.setDepreciationMethod(equipmentDetails.getDepreciationMethod());
        }

        // Structured location (issue #745): an omitted id means "leave the asset where it is";
        // explicit moves go through the dedicated assign endpoint so they leave a history trail.
        if (equipmentDetails.getLocationId() != null) {
            equipment.setLocation(resolveLocation(equipmentDetails, hospital));
        }

        Equipment updatedEquipment = equipmentRepository.save(equipment);

        logger.info(
                "Equipment updated | User: {} | Equipment ID: {} | Name: {}",
                username,
                updatedEquipment.getId(),
                updatedEquipment.getName()
        );

        return updatedEquipment;
    }

    public String generateQrCodeBase64(Long id, String username) {
        Equipment equipment = getEquipmentById(id, username);
        return equipmentQrCodeService.generateQrCodeBase64(equipment);
    }

    @Transactional
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public EquipmentImportSummary importEquipmentFromCsv(MultipartFile file, String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentCsvService.importEquipmentFromCsv(file, hospital, username);
    }

    public EquipmentImportPreviewResponse previewEquipmentImport(MultipartFile file, String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentCsvService.previewEquipmentImport(file, hospital);
    }

    public List<EquipmentImportAuditLog> getImportAuditLogs(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentCsvService.getImportAuditLogs(hospital.getId());
    }

    @Transactional(readOnly = true)
    public void exportEquipmentCsv(String username, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        Hospital hospital = getHospitalForUser(username);
        equipmentCsvService.exportEquipmentCsv(hospital.getId(), response);
    }

    /**
     * Archives (soft deletes) an equipment record.
     * Sets deleted = true, deletedAt, and deletedBy instead of hard deleting.
     */
    @Transactional
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public Equipment archiveEquipment(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(id, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found or you don't have access"));

        equipment.setDeleted(true);
        equipment.setDeletedAt(LocalDateTime.now());
        equipment.setDeletedBy(username);

        Equipment archived = equipmentRepository.save(equipment);

        logger.info(
                "Equipment archived | User: {} | Equipment ID: {} | Name: {}",
                username,
                archived.getId(),
                archived.getName()
        );

        return archived;
    }

    /**
     * Restores an archived equipment record.
     * Sets deleted = false, clears deletedAt and deletedBy.
     */
    @Transactional
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public Equipment restoreEquipment(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = getOwnedArchivedEquipment(id, hospital.getId());

        equipment.setDeleted(false);
        equipment.setDeletedAt(null);
        equipment.setDeletedBy(null);

        Equipment restored = equipmentRepository.save(equipment);

        logger.info(
                "Equipment restored | User: {} | Equipment ID: {} | Name: {}",
                username,
                restored.getId(),
                restored.getName()
        );

        return restored;
    }

    /**
     * Lists all archived (soft-deleted) equipment for the user's hospital.
     */
    public Page<Equipment> getArchivedEquipment(String username, Pageable pageable) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentRepository.findByDeletedTrueAndHospitalId(hospital.getId(), pageable);
    }

    /**
     * Permanently deletes an archived equipment record (admin only).
     * Only callable after 90 days from archival.
     */
    @Transactional
    @Caching(evict = { @CacheEvict(value = "equipmentDashboard", key = "#username"), @CacheEvict(value = "financialDashboard", key = "#username") })
    public void permanentlyDeleteEquipment(Long id, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = getOwnedArchivedEquipment(id, hospital.getId());

        // Missing archive metadata must never shorten the retention window. A malformed or legacy
        // row is retained until its archive timestamp is repaired explicitly.
        if (equipment.getDeletedAt() == null
                || equipment.getDeletedAt().isAfter(LocalDateTime.now().minusDays(90))) {
            throw new IllegalStateException("Equipment cannot be permanently deleted until 90 days after archival");
        }

        equipmentAuditService.logAction(
                equipment,
                equipment.getHospital(),
                username,
                "DELETE",
                "ALL",
                "Equipment existed",
                "Deleted"
        );

        equipmentRepository.delete(equipment);

        logger.info(
                "Equipment permanently deleted | User: {} | Equipment ID: {} | Name: {}",
                username,
                id,
                equipment.getName()
        );
    }

    private Equipment getOwnedArchivedEquipment(Long id, Long hospitalId) {
        return equipmentRepository.findArchivedByIdAndHospitalId(id, hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Archived equipment not found or you don't have access"));
    }
}
