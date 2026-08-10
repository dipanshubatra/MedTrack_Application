package com.medtrack.service;

import com.medtrack.model.Equipment;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.OperationsEventRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled driver for warranty-expiry alerts (issue #703).
 *
 * <p>Runs daily and raises an operations event - broadcast to the hospital's WebSocket
 * subscribers via {@link EventPublisherService} and listed in the event feed - for every asset
 * that enters one of the alert windows: 90, 60 or 30 days before the warranty ends, and on the
 * day of expiry itself. Assets already past expiry are not re-alerted: the EXPIRED status badge
 * on the inventory pages covers them, and daily spam would drown the feed.</p>
 *
 * <p>Alerting is idempotent per asset, contract expiry and window. Both the threshold and expiry
 * date are recorded in the event detail, so repeated runs for the same contract are suppressed
 * without allowing an old contract's alert history to suppress alerts after a warranty renewal.</p>
 */
@Service
@RequiredArgsConstructor
public class WarrantyExpiryAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(WarrantyExpiryAlertScheduler.class);

    /** Alert windows, coarsest first. An asset is alerted once per window it falls into. */
    private static final int[] THRESHOLDS = {90, 60, 30, 0};

    private final EquipmentRepository equipmentRepository;
    private final OperationsEventRepository eventRepository;
    private final EventPublisherService eventPublisherService;

    /**
     * Runs daily at 00:05 server-local time (configurable via
     * {@code app.warranty.alert.cron}).
     */
    @Scheduled(cron = "${app.warranty.alert.cron:0 5 0 * * *}")
    public void runWarrantyAlertGeneration() {
        LocalDate today = LocalDate.now();
        int alertsPublished = 0;

        // The repository scan honours the soft-delete restriction, so archived assets are skipped.
        List<Equipment> inventory = equipmentRepository.findAll();
        for (Equipment equipment : inventory) {
            LocalDate expiry = equipment.getWarrantyExpiry();
            if (expiry == null || equipment.getHospital() == null) {
                continue;
            }
            long daysUntil = ChronoUnit.DAYS.between(today, expiry);
            if (daysUntil < 0) {
                continue;
            }
            Integer threshold = windowFor(daysUntil);
            if (threshold == null || alreadyAlerted(equipment.getId(), expiry, threshold)) {
                continue;
            }
            publishAlert(equipment, threshold, daysUntil);
            alertsPublished++;
        }

        log.info("Warranty alert run finished: {} alerts published", alertsPublished);
    }

    /** The coarsest alert window {@code daysUntil} falls into, or {@code null} if none. */
    private Integer windowFor(long daysUntil) {
        if (daysUntil == 0) {
            return 0;
        }
        if (daysUntil <= 30) {
            return 30;
        }
        if (daysUntil <= 60) {
            return 60;
        }
        if (daysUntil <= 90) {
            return 90;
        }
        return null;
    }

    /**
     * Whether this asset already has an event for the given contract and threshold. Matching both
     * markers preserves idempotency for repeated runs while allowing a renewed warranty to begin a
     * fresh alert cycle. Existing events are compatible because they already include both fields.
     */
    private boolean alreadyAlerted(Long equipmentId, LocalDate expiry, int threshold) {
        String thresholdMarker = "\"threshold\":" + threshold;
        String expiryMarker = "\"expiry\":\"" + expiry + "\"";
        return eventRepository
                .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                        OperationsEvent.EntityType.EQUIPMENT, equipmentId)
                .stream()
                .filter(event -> event.getType() == OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING)
                .map(OperationsEvent::getDetail)
                .filter(detail -> detail != null)
                .anyMatch(detail -> detail.contains(thresholdMarker) && detail.contains(expiryMarker));
    }

    private void publishAlert(Equipment equipment, int threshold, long daysUntil) {
        String title = threshold == 0
                ? "Warranty expires today: " + equipment.getName()
                : "Warranty expires in " + threshold + " days: " + equipment.getName();
        String detail = "{"
                + "\"equipmentCode\":\"" + escape(equipment.getEquipmentCode()) + "\","
                + "\"threshold\":" + threshold + ","
                + "\"daysUntil\":" + daysUntil + ","
                + "\"expiry\":\"" + equipment.getWarrantyExpiry() + "\""
                + "}";
        OperationsEvent.EventSeverity severity = threshold == 0
                ? OperationsEvent.EventSeverity.CRITICAL
                : OperationsEvent.EventSeverity.WARNING;

        eventPublisherService.publishEvent(
                equipment.getHospital().getId(),
                OperationsEvent.EventCategory.EQUIPMENT,
                OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING,
                title,
                detail,
                equipment.getId(),
                OperationsEvent.EntityType.EQUIPMENT,
                "system",
                severity);
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}
