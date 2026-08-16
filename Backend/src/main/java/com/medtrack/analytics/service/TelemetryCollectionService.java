package com.medtrack.analytics.service;

import com.medtrack.analytics.dto.TelemetryEventRequest;
import com.medtrack.analytics.model.SoftwareTelemetryLog;
import com.medtrack.analytics.repository.SoftwareTelemetryLogRepository;
import com.medtrack.auth.model.User;
import com.medtrack.model.Equipment;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryCollectionService {

    private final SoftwareTelemetryLogRepository telemetryLogRepository;
    private final EntityManager entityManager;
    private final GeofenceValidationService geofenceValidationService;

    @Transactional
    public void collectTelemetry(TelemetryEventRequest request) {
        log.debug("Collecting telemetry for user {} action {}", request.getUserId(), request.getActionType());

        // Use getReference to avoid DB query for just setting the foreign key
        User user = entityManager.getReference(User.class, request.getUserId());
        Equipment equipment = null;
        
        if (request.getEquipmentId() != null) {
            equipment = entityManager.getReference(Equipment.class, request.getEquipmentId());
        }

        SoftwareTelemetryLog logEntry = SoftwareTelemetryLog.builder()
                .user(user)
                .equipment(equipment)
                .actionType(request.getActionType())
                .previousActionType(request.getPreviousActionType())
                .timestamp(LocalDateTime.now())
                .ipAddress(request.getIpAddress())
                .endpointAccessed(request.getEndpointAccessed())
                .executionTimeMs(request.getExecutionTimeMs())
                .success(request.getSuccess())
                .responseStatus(request.getResponseStatus())
                .sessionId(request.getSessionId())
                .deviceFingerprint(request.getDeviceFingerprint())
                .metadata(request.getMetadata())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        telemetryLogRepository.save(logEntry);

        // Validate equipment location against geofence (issue #1228)
        if (equipment != null && request.getLatitude() != null && request.getLongitude() != null) {
            geofenceValidationService.validateEquipmentLocation(
                    equipment.getId(),
                    request.getLatitude(),
                    request.getLongitude()
            );
        }
    }
}
