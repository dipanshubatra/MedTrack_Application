package com.medtrack.service;

import com.medtrack.dto.MaintenanceAnalyticsResponse;
import com.medtrack.dto.MaintenanceEquipmentAnalytics;
import com.medtrack.dto.MaintenanceTechnicianAnalytics;
import com.medtrack.dto.MaintenanceTypeAnalytics;
import com.medtrack.model.MaintenanceStatus;
import com.medtrack.model.SlaState;
import com.medtrack.repository.MaintenanceActivityRepository;
import com.medtrack.repository.MaintenanceAnalyticsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceAnalyticsServiceTest {

    @Mock
    private MaintenanceAnalyticsRepository analyticsRepository;

    @Mock
    private MaintenanceActivityRepository activityRepository;

    @InjectMocks
    private MaintenanceAnalyticsService analyticsService;

    private final Long hospitalId = 1L;

    @Test
    void shouldGenerateAnalyticsSuccessfully() {

        when(analyticsRepository.countByHospitalId(hospitalId))
                .thenReturn(100L);

        when(analyticsRepository.countByHospitalIdAndStatus(
                hospitalId,
                MaintenanceStatus.COMPLETED
        )).thenReturn(60L);

        when(analyticsRepository.countByHospitalIdAndStatus(
                hospitalId,
                MaintenanceStatus.CANCELLED
        )).thenReturn(5L);

        when(analyticsRepository.countByHospitalIdAndStatusNot(
                hospitalId,
                MaintenanceStatus.COMPLETED
        )).thenReturn(40L);

        when(
                analyticsRepository
                        .countByHospitalIdAndDeadlineBeforeAndStatusNot(
                                eq(hospitalId),
                                any(LocalDate.class),
                                eq(MaintenanceStatus.COMPLETED)
                        )
        ).thenReturn(10L);

        when(analyticsRepository.getTotalHoursWorked(hospitalId))
                .thenReturn(500.0);

        when(analyticsRepository.getAverageHoursWorked(hospitalId))
                .thenReturn(5.0);

        when(analyticsRepository.getAverageCompletionDays(hospitalId))
                .thenReturn(2.5);

        when(analyticsRepository.countBySlaState(
                hospitalId,
                SlaState.UPCOMING
        )).thenReturn(50L);

        when(analyticsRepository.countBySlaState(
                hospitalId,
                SlaState.WARNING
        )).thenReturn(30L);

        when(analyticsRepository.countBySlaState(
                hospitalId,
                SlaState.BREACHED
        )).thenReturn(20L);

        when(analyticsRepository.countSlaBreaches(hospitalId))
                .thenReturn(20L);

        when(
                analyticsRepository.countTasksCreatedBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(25L);

        when(
                analyticsRepository.countTasksCompletedBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(15L);

        when(
                analyticsRepository.countTasksDueBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(20L);

        when(analyticsRepository.getMaintenanceTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getTechnicianAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getEquipmentAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.countByHospitalId(hospitalId))
                .thenReturn(200L);

        when(
                activityRepository.countByHospitalIdAndOccurredAtBetween(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(50L);

        when(activityRepository.getEventTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.getStatusTransitionAnalytics(
                hospitalId
        )).thenReturn(List.of());

        MaintenanceAnalyticsResponse response =
                analyticsService.getAnalytics(
                        hospitalId,
                        LocalDate.now().minusDays(30),
                        LocalDate.now()
                );

        assertNotNull(response);

        assertEquals(100L, response.getTotalTasks());
        assertEquals(35L, response.getOpenTasks());
        assertEquals(60L, response.getCompletedTasks());
        assertEquals(5L, response.getCancelledTasks());
        assertEquals(10L, response.getOverdueTasks());

        assertEquals(
                500.0,
                response.getTotalHoursWorked()
        );

        assertEquals(
                5.0,
                response.getAverageHoursWorked()
        );

        assertEquals(
                2.5,
                response.getAverageCompletionDays()
        );

        assertEquals(
                50L,
                response.getUpcomingTasks()
        );

        assertEquals(
                30L,
                response.getWarningTasks()
        );

        assertEquals(
                20L,
                response.getBreachedTasks()
        );

        assertEquals(
                20L,
                response.getSlaBreaches()
        );

        assertEquals(
                25L,
                response.getTasksCreatedInPeriod()
        );

        assertEquals(
                15L,
                response.getTasksCompletedInPeriod()
        );

        assertEquals(
                20L,
                response.getTasksDueInPeriod()
        );

        assertEquals(
                200L,
                response.getTotalActivities()
        );

        assertEquals(
                50L,
                response.getActivitiesInPeriod()
        );
    }

    @Test
    void shouldUseCurrentMonthWhenDatesAreMissing() {

        when(analyticsRepository.countByHospitalId(hospitalId))
                .thenReturn(0L);

        when(analyticsRepository.countByHospitalIdAndStatus(
                eq(hospitalId),
                any(MaintenanceStatus.class)
        )).thenReturn(0L);

        when(analyticsRepository.countByHospitalIdAndStatusNot(
                eq(hospitalId),
                any(MaintenanceStatus.class)
        )).thenReturn(0L);

        when(
                analyticsRepository
                        .countByHospitalIdAndDeadlineBeforeAndStatusNot(
                                eq(hospitalId),
                                any(LocalDate.class),
                                any(MaintenanceStatus.class)
                        )
        ).thenReturn(0L);

        when(analyticsRepository.getTotalHoursWorked(hospitalId))
                .thenReturn(0.0);

        when(analyticsRepository.getAverageHoursWorked(hospitalId))
                .thenReturn(0.0);

        when(analyticsRepository.getAverageCompletionDays(hospitalId))
                .thenReturn(0.0);

        when(analyticsRepository.countBySlaState(
                eq(hospitalId),
                any(SlaState.class)
        )).thenReturn(0L);

        when(analyticsRepository.countSlaBreaches(hospitalId))
                .thenReturn(0L);

        when(analyticsRepository.countTasksCreatedBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(analyticsRepository.countTasksCompletedBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(analyticsRepository.countTasksDueBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(analyticsRepository.getMaintenanceTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getTechnicianAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(analyticsRepository.getEquipmentAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.countByHospitalId(hospitalId))
                .thenReturn(0L);

        when(activityRepository.countByHospitalIdAndOccurredAtBetween(
                eq(hospitalId),
                any(),
                any()
        )).thenReturn(0L);

        when(activityRepository.getEventTypeAnalytics(
                hospitalId
        )).thenReturn(List.of());

        when(activityRepository.getStatusTransitionAnalytics(
                hospitalId
        )).thenReturn(List.of());

        MaintenanceAnalyticsResponse response =
                analyticsService.getAnalytics(
                        hospitalId,
                        null,
                        null
                );

        assertNotNull(response);
        assertEquals(0L, response.getTotalTasks());
        assertEquals(0L, response.getCompletedTasks());
    }

    @Test
    void shouldRejectMissingHospitalId() {

        assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getAnalytics(
                        null,
                        LocalDate.now().minusDays(10),
                        LocalDate.now()
                )
        );

        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldRejectInvalidDateRange() {

        LocalDate start =
                LocalDate.of(2026, 8, 10);

        LocalDate end =
                LocalDate.of(2026, 8, 1);

        assertThrows(
                IllegalArgumentException.class,
                () -> analyticsService.getAnalytics(
                        hospitalId,
                        start,
                        end
                )
        );

        verifyNoInteractions(analyticsRepository);
        verifyNoInteractions(activityRepository);
    }

    @Test
    void shouldReturnDepartmentAnalytics() {

        when(
                analyticsRepository.getDepartmentAnalytics(
                        hospitalId
                )
        ).thenReturn(List.of());

        assertNotNull(
                analyticsService.getDepartmentAnalytics(
                        hospitalId
                )
        );

        verify(
                analyticsRepository
        ).getDepartmentAnalytics(hospitalId);
    }

    @Test
    void shouldReturnTrendAnalytics() {

        when(
                analyticsRepository.getMaintenanceTrend(
                        eq(hospitalId),
                        any(),
                        any()
                )
        ).thenReturn(List.of());

        assertNotNull(
                analyticsService.getMaintenanceTrends(
                        hospitalId,
                        LocalDate.now().minusDays(30),
                        LocalDate.now()
                )
        );

        verify(
                analyticsRepository
        ).getMaintenanceTrend(
                eq(hospitalId),
                any(),
                any()
        );
    }
}