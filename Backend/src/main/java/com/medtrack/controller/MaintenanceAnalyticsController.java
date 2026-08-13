package com.medtrack.controller;

import com.medtrack.dto.MaintenanceAnalyticsResponse;
import com.medtrack.service.MaintenanceAnalyticsService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/maintenance/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class MaintenanceAnalyticsController {

    private final MaintenanceAnalyticsService analyticsService;

    /**
     * Complete maintenance analytics dashboard.
     *
     * Optional date range:
     *
     * ?startDate=2026-01-01&endDate=2026-08-10
     */
    @GetMapping
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceAnalyticsResponse> getAnalytics(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate,

            Principal principal
    ) {

        Long hospitalId = resolveHospitalId(principal);

        return ResponseEntity.ok(
                analyticsService.getAnalytics(
                        hospitalId,
                        startDate,
                        endDate
                )
        );
    }

    /**
     * Current-month analytics shortcut.
     */
    @GetMapping("/current-month")
    @PreAuthorize("hasRole('HOSPITAL')")
    public ResponseEntity<MaintenanceAnalyticsResponse>
    getCurrentMonthAnalytics(
            Principal principal
    ) {

        Long hospitalId = resolveHospitalId(principal);

        return ResponseEntity.ok(
                analyticsService.getCurrentMonthAnalytics(
                        hospitalId
                )
        );
    }

    /**
     * Resolves the hospital belonging to the authenticated user.
     *
     * IMPORTANT:
     * Replace this implementation with the existing MedTrack
     * authentication/hospital-resolution mechanism.
     */
    private Long resolveHospitalId(
            Principal principal
    ) {

        throw new UnsupportedOperationException(
                "Connect resolveHospitalId() to the existing "
                        + "authenticated-user hospital resolution service."
        );
    }
}