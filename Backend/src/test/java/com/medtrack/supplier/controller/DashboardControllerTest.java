package com.medtrack.supplier.controller;

import com.medtrack.supplier.dto.DashboardResponse;
import com.medtrack.supplier.dto.DashboardSummary;
import com.medtrack.supplier.dto.DelayAnalytics;
import com.medtrack.supplier.dto.MonthlyShipmentReport;
import com.medtrack.supplier.dto.PredictionDTO;
import com.medtrack.supplier.dto.RecommendationDTO;
import com.medtrack.supplier.dto.ShipmentRiskDTO;
import com.medtrack.supplier.dto.ShipmentStatistics;
import com.medtrack.supplier.dto.ShipmentTrackingResponse;
import com.medtrack.supplier.dto.SupplierPerformance;
import com.medtrack.supplier.dto.TrendAnalysisDTO;
import com.medtrack.supplier.security.SupplierAccessGuard;
import com.medtrack.supplier.service.DashboardService;
import com.medtrack.supplier.service.prediction.PredictionService;
import com.medtrack.supplier.service.prediction.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    private static final Long AUTHENTICATED_SUPPLIER_ID = 42L;

    @Mock
    private DashboardService dashboardService;

    @Mock
    private PredictionService predictionService;

    @Mock
    private RecommendationService recommendationService;

    @Mock
    private SupplierAccessGuard supplierAccessGuard;

    private Authentication authentication;
    private DashboardController dashboardController;

    @BeforeEach
    void setUp() {
        authentication = new UsernamePasswordAuthenticationToken(
                "supplier@medtrack.com",
                null,
                List.of(() -> "ROLE_SUPPLIER"));
        dashboardController = new DashboardController(
                dashboardService,
                predictionService,
                recommendationService,
                supplierAccessGuard);
    }

    @Test
    void getDashboard_UsesAuthenticatedSupplierId() {
        DashboardResponse expected = DashboardResponse.builder().build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getDashboard(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        DashboardResponse actual = dashboardController.getDashboard(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getDashboard(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    void getSummary_UsesAuthenticatedSupplierId() {
        DashboardSummary expected = DashboardSummary.builder().totalOrders(7).build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getSummary(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        DashboardSummary actual = dashboardController.getSummary(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getSummary(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    void getPerformance_UsesAuthenticatedSupplierId() {
        SupplierPerformance expected = SupplierPerformance.builder().performanceScore(91.0).build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getPerformanceScore(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        SupplierPerformance actual = dashboardController.getPerformance(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getPerformanceScore(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    void getDelayAnalytics_UsesAuthenticatedSupplierId() {
        DelayAnalytics expected = DelayAnalytics.builder().totalDelayedShipments(2).build();
        DashboardResponse dashboard = DashboardResponse.builder().delayAnalytics(expected).build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getDashboard(AUTHENTICATED_SUPPLIER_ID)).thenReturn(dashboard);

        DelayAnalytics actual = dashboardController.getDelayAnalytics(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getDashboard(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    void getShipmentStatistics_UsesAuthenticatedSupplierId() {
        ShipmentStatistics expected = ShipmentStatistics.builder().totalShipments(12).build();
        DashboardResponse dashboard = DashboardResponse.builder().shipmentStatistics(expected).build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getDashboard(AUTHENTICATED_SUPPLIER_ID)).thenReturn(dashboard);

        ShipmentStatistics actual = dashboardController.getShipmentStatistics(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getDashboard(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Statistics compatibility endpoint preserves authenticated supplier isolation")
    void getStatistics_UsesAuthenticatedSupplierId() {
        DashboardResponse expected = DashboardResponse.builder().build();
        resolveAuthenticatedSupplier();
        when(dashboardService.getDashboard(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        DashboardResponse actual = dashboardController.getStatistics(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getDashboard(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Monthly report uses the authenticated supplier ID")
    void getMonthlyOrderSummary_UsesAuthenticatedSupplierId() {
        List<MonthlyShipmentReport> expected = List.of(MonthlyShipmentReport.builder().month("2026-08").build());
        resolveAuthenticatedSupplier();
        when(dashboardService.getMonthlyReports(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        List<MonthlyShipmentReport> actual = dashboardController.getMonthlyOrderSummary(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getMonthlyReports(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Status distribution uses the authenticated supplier ID")
    void getStatusDistribution_UsesAuthenticatedSupplierId() {
        Map<String, Long> expected = Map.of("SHIPPED", 3L);
        resolveAuthenticatedSupplier();
        when(dashboardService.getStatusDistribution(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        Map<String, Long> actual = dashboardController.getStatusDistribution(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getStatusDistribution(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Delayed shipments report uses the authenticated supplier ID")
    void getDelayedShipments_UsesAuthenticatedSupplierId() {
        List<ShipmentTrackingResponse> expected = List.of(ShipmentTrackingResponse.builder().id(9L).build());
        resolveAuthenticatedSupplier();
        when(dashboardService.getDelayedShipmentsReport(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        List<ShipmentTrackingResponse> actual = dashboardController.getDelayedShipments(authentication).getBody();

        assertSame(expected, actual);
        verify(dashboardService).getDelayedShipmentsReport(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Daily forecast uses the authenticated supplier ID")
    void getDailyForecast_UsesAuthenticatedSupplierId() {
        PredictionDTO expected = PredictionDTO.builder().category("DAILY_FORECAST").build();
        resolveAuthenticatedSupplier();
        when(predictionService.getDailyForecast(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        PredictionDTO actual = dashboardController.getDailyForecast(authentication).getBody();

        assertSame(expected, actual);
        verify(predictionService).getDailyForecast(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Weekly forecast uses the authenticated supplier ID")
    void getWeeklyForecast_UsesAuthenticatedSupplierId() {
        PredictionDTO expected = PredictionDTO.builder().category("WEEKLY_FORECAST").build();
        resolveAuthenticatedSupplier();
        when(predictionService.getWeeklyForecast(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        PredictionDTO actual = dashboardController.getWeeklyForecast(authentication).getBody();

        assertSame(expected, actual);
        verify(predictionService).getWeeklyForecast(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Delay prediction uses the authenticated supplier ID")
    void getDelayProbability_UsesAuthenticatedSupplierId() {
        PredictionDTO expected = PredictionDTO.builder().category("DELAY_PROBABILITY").build();
        resolveAuthenticatedSupplier();
        when(predictionService.getDelayProbability(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        PredictionDTO actual = dashboardController.getDelayProbability(authentication).getBody();

        assertSame(expected, actual);
        verify(predictionService).getDelayProbability(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Risk analysis combines the authenticated supplier ID with the requested order")
    void getRiskAnalysis_UsesAuthenticatedSupplierId() {
        ShipmentRiskDTO expected = ShipmentRiskDTO.builder().orderId(88L).build();
        resolveAuthenticatedSupplier();
        when(predictionService.calculateShipmentRisk(AUTHENTICATED_SUPPLIER_ID, 88L)).thenReturn(expected);

        ShipmentRiskDTO actual = dashboardController.getRiskAnalysis(88L, authentication).getBody();

        assertSame(expected, actual);
        verify(predictionService).calculateShipmentRisk(AUTHENTICATED_SUPPLIER_ID, 88L);
    }

    @Test
    @DisplayName("Performance trends use the authenticated supplier ID")
    void getPerformanceTrends_UsesAuthenticatedSupplierId() {
        TrendAnalysisDTO expected = TrendAnalysisDTO.builder().supplierId(AUTHENTICATED_SUPPLIER_ID).build();
        resolveAuthenticatedSupplier();
        when(predictionService.getTrendAnalysis(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        TrendAnalysisDTO actual = dashboardController.getPerformanceTrends(authentication).getBody();

        assertSame(expected, actual);
        verify(predictionService).getTrendAnalysis(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("Recommendations use the authenticated supplier ID")
    void getRecommendations_UsesAuthenticatedSupplierId() {
        List<RecommendationDTO> expected = List.of(RecommendationDTO.builder().type("IMMEDIATE_ACTION").build());
        resolveAuthenticatedSupplier();
        when(recommendationService.getRecommendations(AUTHENTICATED_SUPPLIER_ID)).thenReturn(expected);

        List<RecommendationDTO> actual = dashboardController.getRecommendations(authentication).getBody();

        assertSame(expected, actual);
        verify(recommendationService).getRecommendations(AUTHENTICATED_SUPPLIER_ID);
    }

    @Test
    @DisplayName("An unresolved principal is denied instead of falling back to another account")
    void getDashboard_UnresolvedPrincipal_DeniesAccessWithoutCallingServices() {
        AccessDeniedException denied = new AccessDeniedException("Authenticated user could not be resolved");
        when(supplierAccessGuard.resolveCallerId(authentication)).thenThrow(denied);

        AccessDeniedException actual = assertThrows(
                AccessDeniedException.class,
                () -> dashboardController.getDashboard(authentication));

        assertSame(denied, actual);
        verifyNoInteractions(dashboardService, predictionService, recommendationService);
    }

    private void resolveAuthenticatedSupplier() {
        when(supplierAccessGuard.resolveCallerId(authentication)).thenReturn(AUTHENTICATED_SUPPLIER_ID);
    }
}
