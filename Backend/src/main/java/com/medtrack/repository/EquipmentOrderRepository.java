package com.medtrack.repository;

import com.medtrack.model.EquipmentOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentOrderRepository extends JpaRepository<EquipmentOrder, Long> {
    Optional<EquipmentOrder> findByOrderCode(String orderCode);

    List<EquipmentOrder> findByHospital(String hospital);

    Page<EquipmentOrder> findByHospital(String hospital, Pageable pageable);

    @Query("SELECT order FROM EquipmentOrder order "
            + "WHERE EXISTS (SELECT shipment FROM ShipmentTracking shipment "
            + "WHERE shipment.orderId = order.id AND shipment.supplierId = :supplierId)")
    Page<EquipmentOrder> findBySupplierId(
            @Param("supplierId") Long supplierId,
            Pageable pageable);

    @Query("SELECT order FROM EquipmentOrder order "
            + "WHERE EXISTS (SELECT shipment FROM ShipmentTracking shipment "
            + "WHERE shipment.orderId = order.id AND shipment.supplierId = :supplierId)")
    List<EquipmentOrder> findBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT order FROM EquipmentOrder order WHERE order.id = :orderId "
            + "AND EXISTS (SELECT shipment FROM ShipmentTracking shipment "
            + "WHERE shipment.orderId = order.id AND shipment.supplierId = :supplierId)")
    Optional<EquipmentOrder> findByIdAndSupplierId(
            @Param("orderId") Long orderId,
            @Param("supplierId") Long supplierId);

    List<EquipmentOrder> findByStatus(String status);

    List<EquipmentOrder> findByEquipmentId(String equipmentId);

    List<EquipmentOrder> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT o FROM EquipmentOrder o WHERE "
            + "(:status IS NULL OR o.status = :status) AND "
            + "(:shippingStatus IS NULL OR o.shippingStatus = :shippingStatus) AND "
            + "(:startDate IS NULL OR o.orderDate >= :startDate) AND "
            + "(:endDate IS NULL OR o.orderDate <= :endDate) AND "
            + "(:trackingNumber IS NULL OR LOWER(o.trackingNo) LIKE LOWER(CONCAT('%', :trackingNumber, '%')) "
            + "OR EXISTS (SELECT tracking FROM ShipmentTracking tracking "
            + "WHERE tracking.orderId = o.id AND LOWER(tracking.shipmentTrackingNumber) "
            + "LIKE LOWER(CONCAT('%', :trackingNumber, '%')))) AND "
            + "(:hasShipmentFilters = false OR EXISTS (SELECT shipment FROM ShipmentTracking shipment "
            + "WHERE shipment.orderId = o.id "
            + "AND (:supplierId IS NULL OR shipment.supplierId = :supplierId) "
            + "AND (:deliveryStatus IS NULL OR shipment.shipmentStatus = :deliveryStatus) "
            + "AND (:isDelayed IS NULL OR shipment.delayDetected = :isDelayed))) AND "
            + "(:search IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "OR LOWER(o.equipmentName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<EquipmentOrder> findAdvancedSupplierOrders(
            @Param("status") String status,
            @Param("shippingStatus") String shippingStatus,
            @Param("deliveryStatus") com.medtrack.supplier.model.ShipmentStatus deliveryStatus,
            @Param("isDelayed") Boolean isDelayed,
            @Param("trackingNumber") String trackingNumber,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("supplierId") Long supplierId,
            @Param("search") String search,
            @Param("hasShipmentFilters") boolean hasShipmentFilters,
            Pageable pageable);

    @Query("SELECT COUNT(order) FROM EquipmentOrder order "
            + "WHERE EXISTS (SELECT shipment FROM ShipmentTracking shipment "
            + "WHERE shipment.orderId = order.id AND shipment.supplierId = :supplierId)")
    long countTotalOrdersBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COUNT(order) FROM EquipmentOrder order WHERE order.status = :status "
            + "AND EXISTS (SELECT shipment FROM ShipmentTracking shipment "
            + "WHERE shipment.orderId = order.id AND shipment.supplierId = :supplierId)")
    long countOrdersByStatusAndSupplierId(
            @Param("status") String status,
            @Param("supplierId") Long supplierId);

    // Analytics aggregation queries
    @Query("SELECT SUM(o.totalCost) FROM EquipmentOrder o WHERE LOWER(o.hospital) = LOWER(:hospitalName) AND LOWER(o.shippingStatus) = LOWER(:shippingStatus)")
    BigDecimal sumTotalCostByHospitalAndShippingStatus(@Param("hospitalName") String hospitalName, @Param("shippingStatus") String shippingStatus);

    @Query("SELECT o FROM EquipmentOrder o WHERE LOWER(o.hospital) = LOWER(:hospitalName) AND LOWER(o.shippingStatus) = LOWER(:shippingStatus)")
    List<EquipmentOrder> findByHospitalAndShippingStatus(@Param("hospitalName") String hospitalName, @Param("shippingStatus") String shippingStatus);

    // Soft delete - archived records (deleted = true).
    //
    // Native for the same reason as the equipment archive queries: EquipmentOrder carries a
    // class-level @SQLRestriction("deleted = false"), which Hibernate appends to every HQL and
    // criteria query for the entity. As derived queries these asked for `deleted = true AND
    // deleted = false` and could never return a row, so an archived order could not be listed,
    // restored or purged.
    //
    // Being native also means Hibernate applies nothing else either - no tenant filter comes for
    // free here, so every archive query below carries its own owner predicate. An archive lookup
    // that takes only an id is not offered, because the two callers that need one (restore and
    // permanent delete) both act on the row they find.

    @Query(value = "SELECT * FROM equipment_orders WHERE deleted = TRUE AND hospital = :hospital",
            countQuery = "SELECT COUNT(*) FROM equipment_orders WHERE deleted = TRUE AND hospital = :hospital",
            nativeQuery = true)
    Page<EquipmentOrder> findByHospitalAndDeletedTrue(
            @Param("hospital") String hospital,
            Pageable pageable);

    /**
     * The archived orders one supplier is assigned to, through a shipment record.
     *
     * <p>Mirrors {@link #findBySupplierId(Long, Pageable)} for the archive. The unscoped
     * {@code findByDeletedTrue(Pageable)} this replaces returned every archived order in the
     * deployment to any supplier caller.</p>
     */
    @Query(value = "SELECT o.* FROM equipment_orders o WHERE o.deleted = TRUE "
            + "AND EXISTS (SELECT 1 FROM shipment_trackings s "
            + "WHERE s.order_id = o.id AND s.supplier_id = :supplierId)",
            countQuery = "SELECT COUNT(*) FROM equipment_orders o WHERE o.deleted = TRUE "
                    + "AND EXISTS (SELECT 1 FROM shipment_trackings s "
                    + "WHERE s.order_id = o.id AND s.supplier_id = :supplierId)",
            nativeQuery = true)
    Page<EquipmentOrder> findBySupplierIdAndDeletedTrue(
            @Param("supplierId") Long supplierId,
            Pageable pageable);

    /**
     * One archived order, scoped to the hospital that owns it.
     *
     * <p>The owner predicate is in the query rather than in a caller-side check so that restore and
     * permanent delete cannot reach another tenant's archive by id alone.</p>
     */
    @Query(value = "SELECT * FROM equipment_orders WHERE id = :id AND deleted = TRUE "
            + "AND hospital = :hospital", nativeQuery = true)
    Optional<EquipmentOrder> findByIdAndHospitalAndDeletedTrue(
            @Param("id") Long id,
            @Param("hospital") String hospital);
}
