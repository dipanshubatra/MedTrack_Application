package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.MaintenanceWorkOrderAssignmentRequest;
import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.dto.MaintenanceWorkOrderDashboardResponse;
import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.dto.MaintenanceWorkOrderResponse;
import com.medtrack.dto.MaintenanceWorkOrderStatusRequest;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.MaintenanceTask;
import com.medtrack.model.MaintenanceWorkOrder;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import com.medtrack.repository.MaintenanceWorkOrderRepository;
import com.medtrack.specifications.MaintenanceWorkOrderSpecification;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MaintenanceWorkOrderService {

    private final MaintenanceWorkOrderRepository workOrderRepository;

    private final EquipmentRepository equipmentRepository;

    private final MaintenanceTaskRepository maintenanceTaskRepository;

    private final UserRepository userRepository;
    private final MaintenanceWorkOrderValidator workOrderValidator;

    /**
     * Create a new maintenance work order.
     */
    public MaintenanceWorkOrderResponse createWorkOrder(
            MaintenanceWorkOrderRequest request,
            Long hospitalId,
            String username
    ) {

        if (hospitalId == null) {
            throw new IllegalArgumentException(
                    "Hospital ID is required"
            );
        }

        Equipment equipment = equipmentRepository
                .findById(request.getEquipmentId())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Equipment not found with id: "
                                        + request.getEquipmentId()
                        )
                );

        validateEquipmentOwnership(
                equipment,
                hospitalId
        );

        validateEquipmentIsServiceable(equipment);

        MaintenanceTask maintenanceTask = null;

        if (request.getMaintenanceTaskId() != null) {

            maintenanceTask = maintenanceTaskRepository
                    .findById(request.getMaintenanceTaskId())
                    .orElseThrow(() ->
                            new EntityNotFoundException(
                                    "Maintenance task not found with id: "
                                            + request.getMaintenanceTaskId()
                            )
                    );

            validateMaintenanceTaskOwnership(
                    maintenanceTask,
                    hospitalId
            );
        }

        User assignedUser = null;

        if (request.getAssignedUserId() != null) {

            assignedUser = userRepository
                    .findById(request.getAssignedUserId())
                    .orElseThrow(() ->
                            new EntityNotFoundException(
                                    "Assigned user not found with id: "
                                            + request.getAssignedUserId()
                            )
                    );
        }

        MaintenanceWorkOrderStatus initialStatus =
                assignedUser == null
                        ? MaintenanceWorkOrderStatus.OPEN
                        : MaintenanceWorkOrderStatus.ASSIGNED;

        MaintenanceWorkOrder workOrder =
                MaintenanceWorkOrder.builder()
                        .workOrderCode(generateWorkOrderCode())
                        .hospitalId(hospitalId)
                        .equipment(equipment)
                        .maintenanceTask(maintenanceTask)
                        .title(request.getTitle())
                        .description(request.getDescription())
                        .maintenanceType(
                                request.getMaintenanceType()
                        )
                        .priority(request.getPriority())
                        .status(initialStatus)
                        .assignedUser(assignedUser)
                        .assignedTechnician(
                                request.getAssignedTechnician()
                        )
                        .scheduledDate(
                                request.getScheduledDate()
                        )
                        .dueDate(
                                request.getDueDate()
                        )
                        .createdAt(LocalDateTime.now())
                        .createdBy(username)
                        .deleted(false)
                        .build();

        MaintenanceWorkOrder saved =
                workOrderRepository.save(workOrder);

        return toResponse(saved);
    }

    /**
     * Get a work order by ID while enforcing hospital ownership.
     */
    @Transactional
    public MaintenanceWorkOrderResponse getWorkOrder(
            Long id,
            Long hospitalId
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        return toResponse(workOrder);
    }

    /**
     * Get all work orders belonging to a hospital.
     */
    @Transactional
    public List<MaintenanceWorkOrderResponse> getAllWorkOrders(
            Long hospitalId
    ) {

        return workOrderRepository
                .findAllByHospitalIdOrderByCreatedAtDesc(hospitalId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get work orders using all supported filters.
     */
    @Transactional
    public Page<MaintenanceWorkOrderResponse> searchWorkOrders(
            Long hospitalId,
            MaintenanceWorkOrderStatus status,
            MaintenanceWorkOrderPriority priority,
            MaintenanceWorkOrderType maintenanceType,
            Long equipmentId,
            Long assignedUserId,
            LocalDate createdFrom,
            LocalDate createdTo,
            LocalDate dueFrom,
            LocalDate dueTo,
            String search,
            Boolean overdue,
            int page,
            int size,
            String sortBy,
            String direction
    ) {

        if (page < 0) {
            page = 0;
        }

        if (size <= 0) {
            size = 20;
        }

        if (size > 100) {
            size = 100;
        }

        Sort.Direction sortDirection =
                "desc".equalsIgnoreCase(direction)
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;

        String safeSortField =
                resolveSortField(sortBy);

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                sortDirection,
                                safeSortField
                        )
                );

        Specification<MaintenanceWorkOrder> specification =
                MaintenanceWorkOrderSpecification.build(
                        hospitalId,
                        status,
                        priority,
                        maintenanceType,
                        equipmentId,
                        assignedUserId,
                        createdFrom,
                        createdTo,
                        dueFrom,
                        dueTo,
                        search,
                        overdue
                );

        return workOrderRepository
                .findAll(specification, pageable)
                .map(this::toResponse);
    }

    /**
     * Assign a work order to a technician.
     */
    public MaintenanceWorkOrderResponse assignWorkOrder(
            Long id,
            MaintenanceWorkOrderAssignmentRequest request,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        validateStatusForAssignment(workOrder);

        User assignedUser =
                userRepository
                        .findById(request.getAssignedUserId())
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Assigned user not found with id: "
                                                + request.getAssignedUserId()
                                )
                        );

        workOrder.setAssignedUser(assignedUser);

        if (request.getAssignedTechnician() != null
                && !request.getAssignedTechnician().isBlank()) {

            workOrder.setAssignedTechnician(
                    request.getAssignedTechnician()
            );

        } else {

            workOrder.setAssignedTechnician(
                    assignedUser.getUsername()
            );
        }

        workOrder.setStatus(
                MaintenanceWorkOrderStatus.ASSIGNED
        );

        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(
                workOrderRepository.save(workOrder)
        );
    }

    /**
     * Start execution of a work order.
     */
    public MaintenanceWorkOrderResponse startWorkOrder(
            Long id,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        if (workOrder.getStatus()
                != MaintenanceWorkOrderStatus.ASSIGNED
                && workOrder.getStatus()
                != MaintenanceWorkOrderStatus.ON_HOLD) {

            throw new IllegalStateException(
                    "Only ASSIGNED or ON_HOLD work orders can be started"
            );
        }

        if (workOrder.getAssignedUser() == null) {

            throw new IllegalStateException(
                    "A technician must be assigned before work can start"
            );
        }

        workOrder.setStatus(
                MaintenanceWorkOrderStatus.IN_PROGRESS
        );

        if (workOrder.getStartedAt() == null) {

            workOrder.setStartedAt(
                    LocalDateTime.now()
            );
        }

        workOrder.setHoldReason(null);
        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(
                workOrderRepository.save(workOrder)
        );
    }

    /**
     * Put an active work order on hold.
     */
    public MaintenanceWorkOrderResponse holdWorkOrder(
            Long id,
            MaintenanceWorkOrderStatusRequest request,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        if (workOrder.getStatus()
                != MaintenanceWorkOrderStatus.IN_PROGRESS
                && workOrder.getStatus()
                != MaintenanceWorkOrderStatus.ASSIGNED) {

            throw new IllegalStateException(
                    "Only ASSIGNED or IN_PROGRESS work orders can be put on hold"
            );
        }

        if (request.getReason() == null
                || request.getReason().isBlank()) {

            throw new IllegalArgumentException(
                    "A reason is required when putting a work order on hold"
            );
        }

        workOrder.setStatus(
                MaintenanceWorkOrderStatus.ON_HOLD
        );

        workOrder.setHoldReason(
                request.getReason().trim()
        );

        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(
                workOrderRepository.save(workOrder)
        );
    }

    /**
     * Complete a work order.
     */
    public MaintenanceWorkOrderResponse completeWorkOrder(
            Long id,
            MaintenanceWorkOrderCompletionRequest request,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        if (workOrder.getStatus()
                != MaintenanceWorkOrderStatus.IN_PROGRESS) {

            throw new IllegalStateException(
                    "Only IN_PROGRESS work orders can be completed"
            );
        }

        workOrder.setStatus(
                MaintenanceWorkOrderStatus.COMPLETED
        );

        workOrder.setCompletedAt(
                LocalDateTime.now()
        );

        workOrder.setCompletionNotes(
                request.getCompletionNotes()
        );

        workOrder.setHoursWorked(
                request.getHoursWorked()
        );

        workOrder.setPartsUsed(
                request.getPartsUsed()
        );

        workOrder.setSignature(
                request.getSignature()
        );

        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(
                workOrderRepository.save(workOrder)
        );
    }

    /**
     * Cancel a work order.
     */
    public MaintenanceWorkOrderResponse cancelWorkOrder(
            Long id,
            MaintenanceWorkOrderStatusRequest request,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        if (workOrder.getStatus()
                == MaintenanceWorkOrderStatus.COMPLETED) {

            throw new IllegalStateException(
                    "Completed work orders cannot be cancelled"
            );
        }

        if (workOrder.getStatus()
                == MaintenanceWorkOrderStatus.CANCELLED) {

            throw new IllegalStateException(
                    "Work order is already cancelled"
            );
        }

        if (request.getReason() == null
                || request.getReason().isBlank()) {

            throw new IllegalArgumentException(
                    "A cancellation reason is required"
            );
        }

        workOrder.setStatus(
                MaintenanceWorkOrderStatus.CANCELLED
        );

        workOrder.setCancelledAt(
                LocalDateTime.now()
        );

        workOrder.setCancellationReason(
                request.getReason().trim()
        );

        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(
                workOrderRepository.save(workOrder)
        );
    }

    /**
     * Generic status transition endpoint.
     *
     * <p>This method deliberately validates every transition rather
     * than allowing arbitrary status changes.</p>
     */
    public MaintenanceWorkOrderResponse updateStatus(
            Long id,
            MaintenanceWorkOrderStatusRequest request,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        MaintenanceWorkOrderStatus current =
                workOrder.getStatus();

        MaintenanceWorkOrderStatus target =
                request.getStatus();

        if (current == target) {
            return toResponse(workOrder);
        }

        validateTransition(
                current,
                target
        );

        if (target
                == MaintenanceWorkOrderStatus.IN_PROGRESS) {

            if (workOrder.getAssignedUser() == null) {

                throw new IllegalStateException(
                        "A technician must be assigned before work can start"
                );
            }

            if (workOrder.getStartedAt() == null) {

                workOrder.setStartedAt(
                        LocalDateTime.now()
                );
            }
        }

        if (target
                == MaintenanceWorkOrderStatus.COMPLETED) {

            workOrder.setCompletedAt(
                    LocalDateTime.now()
            );
        }

        if (target
                == MaintenanceWorkOrderStatus.CANCELLED) {

            if (request.getReason() == null
                    || request.getReason().isBlank()) {

                throw new IllegalArgumentException(
                        "A cancellation reason is required"
                );
            }

            workOrder.setCancellationReason(
                    request.getReason().trim()
            );

            workOrder.setCancelledAt(
                    LocalDateTime.now()
            );
        }

        if (target
                == MaintenanceWorkOrderStatus.ON_HOLD) {

            if (request.getReason() == null
                    || request.getReason().isBlank()) {

                throw new IllegalArgumentException(
                        "A hold reason is required"
                );
            }

            workOrder.setHoldReason(
                    request.getReason().trim()
            );
        }

        workOrder.setStatus(target);
        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        return toResponse(
                workOrderRepository.save(workOrder)
        );
    }

    /**
     * Dashboard summary for a hospital.
     */
    @Transactional
    public MaintenanceWorkOrderDashboardResponse getDashboard(
            Long hospitalId
    ) {

        long total =
                workOrderRepository.count(
                        MaintenanceWorkOrderSpecification
                                .hasHospitalId(hospitalId)
                );

        long open =
                workOrderRepository
                        .countByHospitalIdAndStatus(
                                hospitalId,
                                MaintenanceWorkOrderStatus.OPEN
                        );

        long assigned =
                workOrderRepository
                        .countByHospitalIdAndStatus(
                                hospitalId,
                                MaintenanceWorkOrderStatus.ASSIGNED
                        );

        long inProgress =
                workOrderRepository
                        .countByHospitalIdAndStatus(
                                hospitalId,
                                MaintenanceWorkOrderStatus.IN_PROGRESS
                        );

        long onHold =
                workOrderRepository
                        .countByHospitalIdAndStatus(
                                hospitalId,
                                MaintenanceWorkOrderStatus.ON_HOLD
                        );

        long completed =
                workOrderRepository
                        .countByHospitalIdAndStatus(
                                hospitalId,
                                MaintenanceWorkOrderStatus.COMPLETED
                        );

        long cancelled =
                workOrderRepository
                        .countByHospitalIdAndStatus(
                                hospitalId,
                                MaintenanceWorkOrderStatus.CANCELLED
                        );

        long overdue =
                workOrderRepository.count(
                        MaintenanceWorkOrderSpecification
                                .build(
                                        hospitalId,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        null,
                                        true
                                )
                );

        List<MaintenanceWorkOrderResponse> recent =
                workOrderRepository
                        .findAllByHospitalIdOrderByCreatedAtDesc(
                                hospitalId
                        )
                        .stream()
                        .limit(10)
                        .map(this::toResponse)
                        .toList();

        return MaintenanceWorkOrderDashboardResponse
                .builder()
                .total(total)
                .open(open)
                .assigned(assigned)
                .inProgress(inProgress)
                .onHold(onHold)
                .completed(completed)
                .cancelled(cancelled)
                .overdue(overdue)
                .recentWorkOrders(recent)
                .build();
    }

    /**
     * Get all work orders assigned to a technician.
     */
    @Transactional
    public List<MaintenanceWorkOrderResponse> getTechnicianWorkOrders(
            Long hospitalId,
            Long assignedUserId
    ) {

        return workOrderRepository
                .findAllByHospitalIdAndAssignedUserIdOrderByDueDateAsc(
                        hospitalId,
                        assignedUserId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get all work orders for an equipment item.
     */
    @Transactional
    public List<MaintenanceWorkOrderResponse> getEquipmentWorkOrders(
            Long hospitalId,
            Long equipmentId
    ) {

        return workOrderRepository
                .findAllByHospitalIdAndEquipmentIdOrderByCreatedAtDesc(
                        hospitalId,
                        equipmentId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Soft delete/archive a work order.
     */
    public void archiveWorkOrder(
            Long id,
            Long hospitalId,
            String username
    ) {

        MaintenanceWorkOrder workOrder =
                getOwnedWorkOrder(id, hospitalId);

        if (workOrder.getStatus()
                == MaintenanceWorkOrderStatus.IN_PROGRESS) {

            throw new IllegalStateException(
                    "An IN_PROGRESS work order cannot be archived"
            );
        }

        workOrder.setDeleted(true);
        workOrder.setDeletedAt(
                LocalDateTime.now()
        );
        workOrder.setDeletedBy(username);
        workOrder.setUpdatedBy(username);
        workOrder.setUpdatedAt(LocalDateTime.now());

        workOrderRepository.save(workOrder);
    }

    /**
     * Retrieve an owned work order.
     */
    private MaintenanceWorkOrder getOwnedWorkOrder(
            Long id,
            Long hospitalId
    ) {

        return workOrderRepository
                .findByIdAndHospitalId(id, hospitalId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Work order not found with id: "
                                        + id
                        )
                );
    }

    /**
     * Rejects a work order against an asset that has left the operating fleet.
     *
     * <p>A retired or disposed asset is not on the floor to be serviced, so a work order raised
     * against it dispatches a technician to a device that is not there. The preventive-maintenance
     * side already applies this rule - see {@code MaintenanceTaskRepository.countSchedulableEquipment},
     * which excludes RETIRED and DISPOSED explicitly - and manual work orders had no equivalent.</p>
     */
    private void validateEquipmentIsServiceable(Equipment equipment) {

        EquipmentStatus status = equipment.getStatus();

        if (status == EquipmentStatus.RETIRED
                || status == EquipmentStatus.DISPOSED) {

            throw new IllegalArgumentException(
                    "Equipment "
                            + equipment.getEquipmentCode()
                            + " is "
                            + status.name().toLowerCase()
                            + " and cannot have new maintenance work raised against it"
            );
        }
    }

    /**
     * Validate that equipment belongs to the same hospital.
     */
    private void validateEquipmentOwnership(
            Equipment equipment,
            Long hospitalId
    ) {

        if (equipment.getHospital() == null
                || equipment.getHospital().getId() == null
                || !equipment.getHospital()
                .getId()
                .equals(hospitalId)) {

            throw new SecurityException(
                    "Equipment does not belong to the current hospital"
            );
        }
    }

    /**
     * Validate maintenance-task ownership.
     */
    private void validateMaintenanceTaskOwnership(
            MaintenanceTask task,
            Long hospitalId
    ) {

        if (task.getHospitalId() == null
                || !task.getHospitalId().equals(hospitalId)) {

            throw new SecurityException(
                    "Maintenance task does not belong to the current hospital"
            );
        }
    }

    /**
     * Validate assignment state.
     */
    private void validateStatusForAssignment(
            MaintenanceWorkOrder workOrder
    ) {

        if (workOrder.getStatus()
                == MaintenanceWorkOrderStatus.COMPLETED) {

            throw new IllegalStateException(
                    "Completed work orders cannot be reassigned"
            );
        }

        if (workOrder.getStatus()
                == MaintenanceWorkOrderStatus.CANCELLED) {

            throw new IllegalStateException(
                    "Cancelled work orders cannot be reassigned"
            );
        }
    }

    /**
     * Validate legal status transitions.
     */
    private void validateTransition(
            MaintenanceWorkOrderStatus current,
            MaintenanceWorkOrderStatus target
    ) {

        boolean valid = switch (current) {

            case OPEN ->
                    target == MaintenanceWorkOrderStatus.ASSIGNED
                            || target == MaintenanceWorkOrderStatus.CANCELLED;

            case ASSIGNED ->
                    target == MaintenanceWorkOrderStatus.IN_PROGRESS
                            || target == MaintenanceWorkOrderStatus.ON_HOLD
                            || target == MaintenanceWorkOrderStatus.CANCELLED;

            case IN_PROGRESS ->
                    target == MaintenanceWorkOrderStatus.ON_HOLD
                            || target == MaintenanceWorkOrderStatus.COMPLETED
                            || target == MaintenanceWorkOrderStatus.CANCELLED;

            case ON_HOLD ->
                    target == MaintenanceWorkOrderStatus.IN_PROGRESS
                            || target == MaintenanceWorkOrderStatus.CANCELLED;

            case COMPLETED, CANCELLED ->
                    false;
        };

        if (!valid) {

            throw new IllegalStateException(
                    "Invalid work-order status transition: "
                            + current
                            + " -> "
                            + target
            );
        }
    }

    /**
     * Generate a public work-order identifier.
     *
     * <p>The UUID suffix avoids collisions when multiple work orders
     * are created concurrently.</p>
     */
    private String generateWorkOrderCode() {

        String code;

        do {

            code =
                    "WO-"
                            + UUID.randomUUID()
                            .toString()
                            .substring(0, 8)
                            .toUpperCase();

        } while (
                workOrderRepository
                        .existsByWorkOrderCode(code)
        );

        return code;
    }

    /**
     * Restrict sortable fields to known entity properties.
     */
    private String resolveSortField(
            String requestedField
    ) {

        if (requestedField == null
                || requestedField.isBlank()) {

            return "createdAt";
        }

        return switch (requestedField) {

            case "id" -> "id";

            case "workOrderCode" -> "workOrderCode";

            case "title" -> "title";

            case "priority" -> "priority";

            case "status" -> "status";

            case "scheduledDate" -> "scheduledDate";

            case "dueDate" -> "dueDate";

            case "createdAt" -> "createdAt";

            case "updatedAt" -> "updatedAt";

            default -> "createdAt";
        };
    }

    /**
     * Convert entity to API response.
     */
    private MaintenanceWorkOrderResponse toResponse(
            MaintenanceWorkOrder workOrder
    ) {

        Equipment equipment =
                workOrder.getEquipment();

        // equipmentId and assignedUserId are read-only mirrors of the join columns
        // (insertable = false, updatable = false), so JPA only populates them when the row is
        // read back from the database. Responding straight after a save - which is what
        // createWorkOrder and assignWorkOrder do - would otherwise report them as null. Prefer the
        // relationship, which is the write path, and fall back to the mirror for entities loaded
        // from the database.
        Long resolvedEquipmentId = equipment != null && equipment.getId() != null
                ? equipment.getId()
                : workOrder.getEquipmentId();
        Long resolvedAssignedUserId = workOrder.getAssignedUser() != null
                && workOrder.getAssignedUser().getId() != null
                ? workOrder.getAssignedUser().getId()
                : workOrder.getAssignedUserId();

        return MaintenanceWorkOrderResponse
                .builder()
                .id(workOrder.getId())
                .workOrderCode(
                        workOrder.getWorkOrderCode()
                )
                .hospitalId(
                        workOrder.getHospitalId()
                )
                .equipmentId(
                        resolvedEquipmentId
                )
                .equipmentCode(
                        equipment != null
                                ? equipment.getEquipmentCode()
                                : null
                )
                .equipmentName(
                        equipment != null
                                ? equipment.getName()
                                : null
                )
                .maintenanceTaskId(
                        workOrder.getMaintenanceTaskId()
                )
                .title(
                        workOrder.getTitle()
                )
                .description(
                        workOrder.getDescription()
                )
                .maintenanceType(
                        workOrder.getMaintenanceType()
                )
                .priority(
                        workOrder.getPriority()
                )
                .status(
                        workOrder.getStatus()
                )
                .assignedUserId(
                        resolvedAssignedUserId
                )
                .assignedTechnician(
                        workOrder.getAssignedTechnician()
                )
                .scheduledDate(
                        workOrder.getScheduledDate()
                )
                .dueDate(
                        workOrder.getDueDate()
                )
                .startedAt(
                        workOrder.getStartedAt()
                )
                .completedAt(
                        workOrder.getCompletedAt()
                )
                .cancelledAt(
                        workOrder.getCancelledAt()
                )
                .holdReason(
                        workOrder.getHoldReason()
                )
                .cancellationReason(
                        workOrder.getCancellationReason()
                )
                .completionNotes(
                        workOrder.getCompletionNotes()
                )
                .hoursWorked(
                        workOrder.getHoursWorked()
                )
                .partsUsed(
                        workOrder.getPartsUsed()
                )
                .signature(
                        workOrder.getSignature()
                )
                .createdAt(
                        workOrder.getCreatedAt()
                )
                .updatedAt(
                        workOrder.getUpdatedAt()
                )
                .createdBy(
                        workOrder.getCreatedBy()
                )
                .updatedBy(
                        workOrder.getUpdatedBy()
                )
                .build();
    }
}