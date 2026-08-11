package com.medtrack.controller;

import com.medtrack.dto.MaintenanceWorkOrderAssignmentRequest;
import com.medtrack.dto.MaintenanceWorkOrderCompletionRequest;
import com.medtrack.dto.MaintenanceWorkOrderDashboardResponse;
import com.medtrack.dto.MaintenanceWorkOrderRequest;
import com.medtrack.dto.MaintenanceWorkOrderResponse;
import com.medtrack.dto.MaintenanceWorkOrderStatusRequest;
import com.medtrack.model.MaintenanceWorkOrderPriority;
import com.medtrack.model.MaintenanceWorkOrderStatus;
import com.medtrack.model.MaintenanceWorkOrderType;
import com.medtrack.service.MaintenanceWorkOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/maintenance/work-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MaintenanceWorkOrderController {

    private final MaintenanceWorkOrderService workOrderService;

    /**
     * Creates a new maintenance work order.
     */
    @PostMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> createWorkOrder(
            @Valid @RequestBody MaintenanceWorkOrderRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.createWorkOrder(
                        request,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Retrieves a single work order.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceWorkOrderResponse> getWorkOrder(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.getWorkOrder(
                        id,
                        resolveHospitalId(principal)
                )
        );
    }

    /**
     * Retrieves work orders using filtering, searching and pagination.
     */
    @GetMapping
    public ResponseEntity<Page<MaintenanceWorkOrderResponse>> searchWorkOrders(
            @RequestParam(required = false) MaintenanceWorkOrderStatus status,
            @RequestParam(required = false) MaintenanceWorkOrderPriority priority,
            @RequestParam(required = false) MaintenanceWorkOrderType maintenanceType,
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) Long assignedUserId,
            @RequestParam(required = false) LocalDate createdFrom,
            @RequestParam(required = false) LocalDate createdTo,
            @RequestParam(required = false) LocalDate dueFrom,
            @RequestParam(required = false) LocalDate dueTo,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.searchWorkOrders(
                        resolveHospitalId(principal),
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
                        overdue,
                        page,
                        size,
                        sortBy,
                        direction
                )
        );
    }

    /**
     * Assigns a work order to a technician.
     */
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> assignWorkOrder(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceWorkOrderAssignmentRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.assignWorkOrder(
                        id,
                        request,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Starts work on an assigned work order.
     */
    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> startWorkOrder(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.startWorkOrder(
                        id,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Places an active work order on hold.
     */
    @PostMapping("/{id}/hold")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> holdWorkOrder(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceWorkOrderStatusRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.holdWorkOrder(
                        id,
                        request,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Completes an in-progress work order.
     */
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> completeWorkOrder(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceWorkOrderCompletionRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.completeWorkOrder(
                        id,
                        request,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Cancels an active work order.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> cancelWorkOrder(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceWorkOrderStatusRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.cancelWorkOrder(
                        id,
                        request,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Performs a validated status transition.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceWorkOrderResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceWorkOrderStatusRequest request,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.updateStatus(
                        id,
                        request,
                        resolveHospitalId(principal),
                        principal.getName()
                )
        );
    }

    /**
     * Returns work-order dashboard statistics.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<MaintenanceWorkOrderDashboardResponse> getDashboard(
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.getDashboard(
                        resolveHospitalId(principal)
                )
        );
    }

    /**
     * Returns work orders assigned to a technician.
     */
    @GetMapping("/technician/{userId}")
    public ResponseEntity<List<MaintenanceWorkOrderResponse>>
    getTechnicianWorkOrders(
            @PathVariable Long userId,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.getTechnicianWorkOrders(
                        resolveHospitalId(principal),
                        userId
                )
        );
    }

    /**
     * Returns work orders associated with equipment.
     */
    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<MaintenanceWorkOrderResponse>>
    getEquipmentWorkOrders(
            @PathVariable Long equipmentId,
            Principal principal) {

        return ResponseEntity.ok(
                workOrderService.getEquipmentWorkOrders(
                        resolveHospitalId(principal),
                        equipmentId
                )
        );
    }

    /**
     * Archives a work order instead of physically deleting it.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<Void> archiveWorkOrder(
            @PathVariable Long id,
            Principal principal) {

        workOrderService.archiveWorkOrder(
                id,
                resolveHospitalId(principal),
                principal.getName()
        );

        return ResponseEntity.noContent().build();
    }

    /**
     * Resolves the authenticated user's hospital.
     *
     * <p>This method is intentionally kept behind the controller boundary.
     * Replace the implementation with the project's existing hospital/user
     * resolution mechanism if the application already exposes one.</p>
     */
    private Long resolveHospitalId(Principal principal) {

        throw new UnsupportedOperationException(
                "Connect resolveHospitalId() to the existing authenticated-user "
                        + "hospital resolution service."
        );
    }
}