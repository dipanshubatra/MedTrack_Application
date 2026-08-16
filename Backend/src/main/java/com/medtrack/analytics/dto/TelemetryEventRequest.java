package com.medtrack.analytics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelemetryEventRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long equipmentId;

    @NotBlank(message = "Action type is required")
    private String actionType;

    private String previousActionType;

    private String ipAddress;

    private String endpointAccessed;

    private Integer executionTimeMs;

    @NotNull(message = "Success flag is required")
    private Boolean success;

    private Integer responseStatus;

    private String sessionId;

    private String deviceFingerprint;

    private String metadata;

    // ---------------------------------------------------------------------
    // Geolocation fields (issue #1228)
    //
    // Equipment telemetry may include GPS coordinates for geofence validation.
    // These are optional - not all equipment reports location data.
    // ---------------------------------------------------------------------

    private Double latitude;

    private Double longitude;
}
