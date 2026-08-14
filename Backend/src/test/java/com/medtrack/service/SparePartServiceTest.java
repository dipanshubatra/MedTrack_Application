package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.SparePartResponse;
import com.medtrack.dto.SparePartStockRequest;
import com.medtrack.model.Hospital;
import com.medtrack.model.SparePart;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SparePartServiceTest {

    @Mock private SparePartRepository sparePartRepository;
    @Mock private HospitalRepository hospitalRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private SparePartService sparePartService;

    private User testUser;
    private Hospital testHospital;
    private SparePart testSparePart;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(100L).username("hospitalAdmin").email("admin@hospital.com").role("HOSPITAL").build();
        testHospital = Hospital.builder().id(1L).name("General Hospital").user(testUser).build();
        testSparePart = SparePart.builder().id(50L).hospitalId(1L).partNumber("FILTER-001")
                .description("HEPA Air Filter").compatibleModels("Ventilator X1").stockLevel(25)
                .reorderPoint(10).unitCost(45.50).deleted(false).build();
    }

    @Test
    @DisplayName("createSparePart - successfully saves spare part when valid")
    void createSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(false);
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart created = sparePartService.createSparePart(testSparePart, "hospitalAdmin");
        assertThat(created).isNotNull();
        assertThat(created.getPartNumber()).isEqualTo("FILTER-001");
        verify(sparePartRepository).save(testSparePart);
    }

    @Test
    @DisplayName("createSparePart - throws exception when part number already exists")
    void createSparePart_DuplicatePartNumber_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.existsByHospitalIdAndPartNumberAndDeletedFalse(1L, "FILTER-001")).thenReturn(true);

        assertThatThrownBy(() -> sparePartService.createSparePart(testSparePart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Spare part with part number already exists");
        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("createSparePart - throws exception when payload validation fails")
    void createSparePart_InvalidFields_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        testSparePart.setPartNumber("");
        assertThatThrownBy(() -> sparePartService.createSparePart(testSparePart, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Part number is required");
    }

    @Test
    @DisplayName("updateSparePart - successfully updates spare part")
    void updateSparePart_Success() {
        SparePart updateRequest = SparePart.builder().partNumber("FILTER-001").description("Updated HEPA Filter")
                .compatibleModels("Ventilator X2").stockLevel(30).reorderPoint(15).unitCost(50.00).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdForUpdate(50L, 1L))
                .thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePart updated = sparePartService.updateSparePart(50L, updateRequest, "hospitalAdmin");
        assertThat(updated.getDescription()).isEqualTo("Updated HEPA Filter");
        assertThat(updated.getStockLevel()).isEqualTo(30);
    }

    @Test
    @DisplayName("deductStock - successfully deducts stock for active spare part")
    void deductStock_Success() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(5).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePartResponse updated = sparePartService.deductStock(request, "hospitalAdmin");
        assertThat(updated.getStockLevel()).isEqualTo(20);
        verify(sparePartRepository).findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001");
    }

    @Test
    @DisplayName("deductStock - throws exception when quantity is zero or negative")
    void deductStock_InvalidQuantity_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(-10).build();
        assertThatThrownBy(() -> sparePartService.deductStock(request, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stock adjustment quantity must be greater than zero");
        verifyNoInteractions(userRepository, hospitalRepository, sparePartRepository);
    }

    @Test
    @DisplayName("deductStock - throws exception when stock is insufficient")
    void deductStock_InsufficientStock_ThrowsException() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(100).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductStock(request, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Insufficient stock");
        verify(sparePartRepository, never()).save(any());
    }

    @Test
    @DisplayName("restockSparePart - successfully increases stock level")
    void restockSparePart_Success() {
        SparePartStockRequest request = SparePartStockRequest.builder().partNumber("FILTER-001").quantity(15).build();

        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(
                1L, "FILTER-001")).thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SparePartResponse restocked = sparePartService.restockSparePart(request, "hospitalAdmin");
        assertThat(restocked.getStockLevel()).isEqualTo(40);
    }

    @Test
    @DisplayName("getLowStockAlerts - delegates to repository for active low stock items")
    void getLowStockAlerts_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findLowStockPartsByHospitalId(1L)).thenReturn(List.of(testSparePart));

        List<SparePartResponse> alerts = sparePartService.getLowStockAlerts("hospitalAdmin");
        assertThat(alerts).hasSize(1);
    }

    @Test
    @DisplayName("deleteSparePart - soft deletes the spare part record")
    void deleteSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdForUpdate(50L, 1L))
                .thenReturn(Optional.of(testSparePart));

        sparePartService.deleteSparePart(50L, "hospitalAdmin");

        ArgumentCaptor<SparePart> captor = ArgumentCaptor.forClass(SparePart.class);
        verify(sparePartRepository).save(captor.capture());
        assertThat(captor.getValue().getDeleted()).isTrue();
    }

    @Test
    @DisplayName("getAllSpareParts - filters out soft-deleted spare parts")
    void getAllSpareParts_ExcludesDeletedItems() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByHospitalIdAndDeletedFalse(1L)).thenReturn(List.of(testSparePart));

        List<SparePartResponse> parts = sparePartService.getAllSpareParts("hospitalAdmin");
        assertThat(parts).hasSize(1);
        assertThat(parts.get(0).getPartNumber()).isEqualTo("FILTER-001");
        verify(sparePartRepository).findByHospitalIdAndDeletedFalse(1L);
        verify(sparePartRepository, never()).findByHospitalId(anyLong());
    }

    @Test
    @DisplayName("getSparePart - successfully returns single active spare part")
    void getSparePart_Success() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(50L, 1L))
                .thenReturn(Optional.of(testSparePart));

        SparePartResponse result = sparePartService.getSparePart(50L, "hospitalAdmin");
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(50L);
        assertThat(result.getPartNumber()).isEqualTo("FILTER-001");
    }

    @Test
    @DisplayName("getSparePart - throws ResourceNotFoundException when part is deleted or missing")
    void getSparePart_NotFound_ThrowsException() {
        when(userRepository.findByUsername("hospitalAdmin")).thenReturn(Optional.of(testUser));
        when(hospitalRepository.findByUserId(100L)).thenReturn(Optional.of(testHospital));
        when(sparePartRepository.findByIdAndHospitalIdAndDeletedFalse(999L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> sparePartService.getSparePart(999L, "hospitalAdmin"))
                .isInstanceOf(com.medtrack.exception.ResourceNotFoundException.class)
                .hasMessageContaining("Active spare part not found with ID: 999");
    }

    @Test
    @DisplayName("getSparePart - throws IllegalArgumentException when id is null")
    void getSparePart_NullId_ThrowsException() {
        assertThatThrownBy(() -> sparePartService.getSparePart(null, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Spare part ID is required");
        verifyNoInteractions(userRepository, hospitalRepository, sparePartRepository);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - successfully deducts stock level for valid items")
    void deductSparePartsForWorkOrder_Success() {
        com.medtrack.dto.SparePartDeductionItem item = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("FILTER-001")
                .quantity(3)
                .build();
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));
        when(sparePartRepository.save(any(SparePart.class))).thenAnswer(inv -> inv.getArgument(0));

        sparePartService.deductSparePartsForWorkOrder(List.of(item), 1L, "hospitalAdmin");

        assertThat(testSparePart.getStockLevel()).isEqualTo(22);
        verify(sparePartRepository).save(testSparePart);
    }

    @Test
    @DisplayName("deductSparePartsForWorkOrder - throws IllegalArgumentException when stock is insufficient")
    void deductSparePartsForWorkOrder_InsufficientStock_ThrowsException() {
        com.medtrack.dto.SparePartDeductionItem item = com.medtrack.dto.SparePartDeductionItem.builder()
                .partNumber("FILTER-001")
                .quantity(50)
                .build();
        when(sparePartRepository.findActiveByHospitalIdAndPartNumberForUpdate(1L, "FILTER-001"))
                .thenReturn(Optional.of(testSparePart));

        assertThatThrownBy(() -> sparePartService.deductSparePartsForWorkOrder(List.of(item), 1L, "hospitalAdmin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Insufficient stock for spare part: FILTER-001");
    }
}
