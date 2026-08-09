package com.medtrack.service;

import com.medtrack.dto.EquipmentReportRequest;
import com.medtrack.dto.EquipmentReportResponse;
import com.medtrack.dto.EquipmentReportSummary;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentStatus;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentReportService {

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;

    @Transactional(readOnly = true)
    public EquipmentReportResponse generateReport(
            EquipmentReportRequest request,
            String username
    ) {
        Hospital hospital = hospitalRepository
                .findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found for user: " + username));

        List<Equipment> allEquipment = equipmentRepository.findByHospitalId(hospital.getId());

        List<Equipment> filtered = allEquipment.stream()
                .filter(e -> request.getDepartment() == null ||
                        (e.getDepartment() != null && e.getDepartment().equalsIgnoreCase(request.getDepartment().trim())))
                .filter(e -> request.getCategory() == null ||
                        e.getCategory() == request.getCategory())
                .filter(e -> request.getStatus() == null ||
                        e.getStatus() == request.getStatus())
                .filter(e -> request.getManufacturer() == null ||
                        (e.getManufacturer() != null && e.getManufacturer().equalsIgnoreCase(request.getManufacturer().trim())))
                .filter(e -> request.getPurchaseStartDate() == null ||
                        (e.getPurchaseDate() != null && !e.getPurchaseDate().isBefore(request.getPurchaseStartDate())))
                .filter(e -> request.getPurchaseEndDate() == null ||
                        (e.getPurchaseDate() != null && !e.getPurchaseDate().isAfter(request.getPurchaseEndDate())))
                .filter(e -> request.getWarrantyExpired() == null ||
                        (e.getWarrantyExpiry() != null &&
                                request.getWarrantyExpired().equals(e.getWarrantyExpiry().isBefore(LocalDate.now()))))
                .toList();

        EquipmentReportSummary summary = EquipmentReportSummary.builder()
                .totalEquipment(filtered.size())
                .active(filtered.stream().filter(e -> e.getStatus() == EquipmentStatus.ACTIVE).count())
                .maintenance(filtered.stream().filter(e -> e.getStatus() == EquipmentStatus.UNDER_MAINTENANCE).count())
                .retired(filtered.stream().filter(e -> e.getStatus() == EquipmentStatus.RETIRED).count())
                .expiredWarranty(filtered.stream()
                        .filter(e -> e.getWarrantyExpiry() != null && e.getWarrantyExpiry().isBefore(LocalDate.now()))
                        .count())
                .expiringSoon(filtered.stream()
                        .filter(e -> e.getWarrantyExpiry() != null &&
                                !e.getWarrantyExpiry().isBefore(LocalDate.now()) &&
                                !e.getWarrantyExpiry().isAfter(LocalDate.now().plusDays(30)))
                        .count())
                .lowStock(filtered.stream()
                        .filter(e -> e.getQuantity() != null && e.getMinimumStock() != null && e.getQuantity() <= e.getMinimumStock())
                        .count())
                .build();

        return EquipmentReportResponse.builder()
                .summary(summary)
                .equipment(filtered)
                .build();
    }
}