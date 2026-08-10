package com.medtrack.service;

import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.model.OperationsEvent;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.OperationsEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("WarrantyExpiryAlertScheduler")
class WarrantyExpiryAlertSchedulerTest {

    private static final Long HOSPITAL_ID = 7L;
    private static final Long EQUIPMENT_ID = 42L;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private OperationsEventRepository eventRepository;

    @Mock
    private EventPublisherService eventPublisherService;

    private WarrantyExpiryAlertScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new WarrantyExpiryAlertScheduler(
                equipmentRepository,
                eventRepository,
                eventPublisherService);
    }

    @Nested
    @DisplayName("alert-window selection")
    class AlertWindowSelection {

        @Test
        @DisplayName("publishes the 90-day warning in the outer alert window")
        void publishesNinetyDayWarning() {
            LocalDate expiry = LocalDate.now().plusDays(75);
            Equipment equipment = equipment(expiry);
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment));
            when(existingEvents()).thenReturn(List.of());

            scheduler.runWarrantyAlertGeneration();

            PublishedAlert alert = capturePublishedAlert();
            assertEquals("Warranty expires in 90 days: MRI Scanner", alert.title());
            assertEquals(OperationsEvent.EventSeverity.WARNING, alert.severity());
            assertTrue(alert.detail().contains("\"threshold\":90"));
            assertTrue(alert.detail().contains("\"daysUntil\":75"));
            assertTrue(alert.detail().contains("\"expiry\":\"" + expiry + "\""));
        }

        @Test
        @DisplayName("publishes a critical alert on the expiry date")
        void publishesCriticalExpiryDayAlert() {
            LocalDate expiry = LocalDate.now();
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment(expiry)));
            when(existingEvents()).thenReturn(List.of());

            scheduler.runWarrantyAlertGeneration();

            PublishedAlert alert = capturePublishedAlert();
            assertEquals("Warranty expires today: MRI Scanner", alert.title());
            assertEquals(OperationsEvent.EventSeverity.CRITICAL, alert.severity());
            assertTrue(alert.detail().contains("\"threshold\":0"));
            assertTrue(alert.detail().contains("\"daysUntil\":0"));
        }

        @Test
        @DisplayName("does not publish before the 90-day alert horizon")
        void ignoresWarrantyOutsideAlertHorizon() {
            when(equipmentRepository.findAll())
                    .thenReturn(List.of(equipment(LocalDate.now().plusDays(91))));

            scheduler.runWarrantyAlertGeneration();

            verify(eventRepository, never())
                    .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(any(), anyLong());
            verify(eventPublisherService, never()).publishEvent(
                    anyLong(), any(), any(), any(), any(), anyLong(), any(), any(), any());
        }

        @Test
        @DisplayName("does not publish for an already-expired warranty")
        void ignoresExpiredWarranty() {
            when(equipmentRepository.findAll())
                    .thenReturn(List.of(equipment(LocalDate.now().minusDays(1))));

            scheduler.runWarrantyAlertGeneration();

            verify(eventRepository, never())
                    .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(any(), anyLong());
            verify(eventPublisherService, never()).publishEvent(
                    anyLong(), any(), any(), any(), any(), anyLong(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("contract-aware idempotency")
    class ContractAwareIdempotency {

        @Test
        @DisplayName("suppresses the same threshold for the same contract expiry")
        void suppressesDuplicateForSameContract() {
            LocalDate expiry = LocalDate.now().plusDays(20);
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment(expiry)));
            when(existingEvents()).thenReturn(List.of(warrantyEvent(expiry, 30)));

            scheduler.runWarrantyAlertGeneration();

            verify(eventPublisherService, never()).publishEvent(
                    anyLong(), any(), any(), any(), any(), anyLong(), any(), any(), any());
        }

        @Test
        @DisplayName("publishes again when a renewal changes the contract expiry")
        void renewalStartsFreshAlertCycle() {
            LocalDate renewedExpiry = LocalDate.now().plusDays(20);
            LocalDate previousExpiry = renewedExpiry.minusYears(1);
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment(renewedExpiry)));
            when(existingEvents()).thenReturn(List.of(warrantyEvent(previousExpiry, 30)));

            scheduler.runWarrantyAlertGeneration();

            PublishedAlert alert = capturePublishedAlert();
            assertTrue(alert.detail().contains("\"threshold\":30"));
            assertTrue(alert.detail().contains("\"expiry\":\"" + renewedExpiry + "\""));
        }

        @Test
        @DisplayName("another threshold for the current contract remains eligible")
        void differentThresholdForSameContractIsNotDuplicate() {
            LocalDate expiry = LocalDate.now().plusDays(25);
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment(expiry)));
            when(existingEvents()).thenReturn(List.of(warrantyEvent(expiry, 60)));

            scheduler.runWarrantyAlertGeneration();

            PublishedAlert alert = capturePublishedAlert();
            assertTrue(alert.detail().contains("\"threshold\":30"));
            assertTrue(alert.detail().contains("\"expiry\":\"" + expiry + "\""));
        }
    }

    @Nested
    @DisplayName("payload and inventory safeguards")
    class PayloadAndInventorySafeguards {

        @Test
        @DisplayName("skips equipment without a warranty expiry")
        void skipsMissingExpiry() {
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment(null)));

            scheduler.runWarrantyAlertGeneration();

            verify(eventRepository, never())
                    .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(any(), anyLong());
            verify(eventPublisherService, never()).publishEvent(
                    anyLong(), any(), any(), any(), any(), anyLong(), any(), any(), any());
        }

        @Test
        @DisplayName("skips equipment that is not assigned to a hospital")
        void skipsMissingHospital() {
            Equipment equipment = equipment(LocalDate.now().plusDays(20));
            equipment.setHospital(null);
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment));

            scheduler.runWarrantyAlertGeneration();

            verify(eventRepository, never())
                    .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(any(), anyLong());
            verify(eventPublisherService, never()).publishEvent(
                    anyLong(), any(), any(), any(), any(), anyLong(), any(), any(), any());
        }

        @Test
        @DisplayName("publishes one alert for each eligible inventory item")
        void publishesEachEligibleItem() {
            Equipment first = equipment(LocalDate.now().plusDays(15));
            Equipment second = equipment(LocalDate.now().plusDays(55));
            second.setId(43L);
            second.setName("Infusion Pump");
            when(equipmentRepository.findAll()).thenReturn(List.of(first, second));
            when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    OperationsEvent.EntityType.EQUIPMENT, EQUIPMENT_ID)).thenReturn(List.of());
            when(eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                    OperationsEvent.EntityType.EQUIPMENT, 43L)).thenReturn(List.of());

            scheduler.runWarrantyAlertGeneration();

            verify(eventPublisherService, times(2)).publishEvent(
                    eq(HOSPITAL_ID),
                    eq(OperationsEvent.EventCategory.EQUIPMENT),
                    eq(OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING),
                    any(), any(), anyLong(),
                    eq(OperationsEvent.EntityType.EQUIPMENT),
                    eq("system"),
                    eq(OperationsEvent.EventSeverity.WARNING));
        }

        @Test
        @DisplayName("escapes equipment codes in the JSON event detail")
        void escapesEquipmentCode() {
            Equipment equipment = equipment(LocalDate.now().plusDays(10));
            equipment.setEquipmentCode("MRI\\\"primary");
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment));
            when(existingEvents()).thenReturn(List.of());

            scheduler.runWarrantyAlertGeneration();

            PublishedAlert alert = capturePublishedAlert();
            assertTrue(alert.detail().contains("\"equipmentCode\":\"MRI\\\\\\\"primary\""));
        }

        @Test
        @DisplayName("uses an empty code when the equipment code is absent")
        void handlesMissingEquipmentCode() {
            Equipment equipment = equipment(LocalDate.now().plusDays(10));
            equipment.setEquipmentCode(null);
            when(equipmentRepository.findAll()).thenReturn(List.of(equipment));
            when(existingEvents()).thenReturn(List.of());

            scheduler.runWarrantyAlertGeneration();

            PublishedAlert alert = capturePublishedAlert();
            assertTrue(alert.detail().contains("\"equipmentCode\":\"\""));
        }
    }

    private Equipment equipment(LocalDate expiry) {
        return Equipment.builder()
                .id(EQUIPMENT_ID)
                .equipmentCode("MRI-001")
                .name("MRI Scanner")
                .hospital(Hospital.builder().id(HOSPITAL_ID).name("City General").build())
                .warrantyExpiry(expiry)
                .build();
    }

    private OperationsEvent warrantyEvent(LocalDate expiry, int threshold) {
        return OperationsEvent.builder()
                .type(OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING)
                .detail(detail(expiry, threshold))
                .build();
    }

    private String detail(LocalDate expiry, int threshold) {
        return "{\"threshold\":" + threshold + ",\"expiry\":\"" + expiry + "\"}";
    }

    private List<OperationsEvent> existingEvents() {
        return eventRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(
                OperationsEvent.EntityType.EQUIPMENT, EQUIPMENT_ID);
    }

    private PublishedAlert capturePublishedAlert() {
        ArgumentCaptor<String> title = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> detail = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<OperationsEvent.EventSeverity> severity =
                ArgumentCaptor.forClass(OperationsEvent.EventSeverity.class);

        verify(eventPublisherService).publishEvent(
                eq(HOSPITAL_ID),
                eq(OperationsEvent.EventCategory.EQUIPMENT),
                eq(OperationsEvent.EventType.EQUIPMENT_WARRANTY_EXPIRING),
                title.capture(),
                detail.capture(),
                eq(EQUIPMENT_ID),
                eq(OperationsEvent.EntityType.EQUIPMENT),
                eq("system"),
                severity.capture());

        return new PublishedAlert(title.getValue(), detail.getValue(), severity.getValue());
    }

    private record PublishedAlert(
            String title,
            String detail,
            OperationsEvent.EventSeverity severity) {
    }
}
