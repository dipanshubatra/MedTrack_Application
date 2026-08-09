package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentFinancialDashboardResponse;
import com.medtrack.dto.EquipmentFinancialResponse;
import com.medtrack.dto.EquipmentFinancialSummary;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.DepreciationMethod;
import com.medtrack.model.Equipment;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.util.DepreciationCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Depreciation and fleet-valuation reporting for the equipment owned by one hospital.
 *
 * <p>Every read is scoped to the hospital that owns the authenticated user, so an asset belonging
 * to another tenant can neither be valued nor counted in a summary.</p>
 */
@Service
@RequiredArgsConstructor
public class EquipmentFinancialService {

    /**
     * Residual value assumed when an asset has no salvage figure recorded. Equipment does not
     * store one, so the reports fall back to a tenth of the purchase price and say so through
     * {@code salvageValue} in the response rather than hiding the assumption.
     */
    private static final double DEFAULT_SALVAGE_RATE = 0.10;

    /** Depreciable life assumed when an asset has none recorded. */
    private static final int DEFAULT_USEFUL_LIFE_YEARS = 10;

    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private Hospital getHospitalForUser(String usernameOrEmail) {
        User user = userRepository.findByEmail(usernameOrEmail)
                .orElseGet(() -> userRepository.findByUsername(usernameOrEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + usernameOrEmail)));

        return hospitalRepository.findByUserId(user.getId())
                .orElseGet(() -> hospitalRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + usernameOrEmail)));
    }

    public EquipmentFinancialDashboardResponse getFinancialDashboard(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<Equipment> equipmentList = equipmentRepository.findByHospitalId(hospital.getId());

        EquipmentFinancialSummary summary = new EquipmentFinancialSummary();
        EquipmentFinancialDashboardResponse response = new EquipmentFinancialDashboardResponse();
        response.setGeneratedAt(LocalDateTime.now());
        response.setGeneratedBy(username);

        double totalAssetValue = 0, currentAssetValue = 0, totalDepreciation = 0;
        long replacementRecommended = 0;
        List<EquipmentFinancialResponse> responses = new ArrayList<>();

        for (Equipment equipment : equipmentList) {
            EquipmentFinancialResponse item = getEquipmentFinancialAnalysis(equipment.getId(), username);
            responses.add(item);
            totalAssetValue += item.getPurchaseCost();
            currentAssetValue += item.getCurrentValue();
            totalDepreciation += item.getDepreciationAmount();
            if (item.getRemainingUsefulLife() <= 1) replacementRecommended++;
        }

        summary.setTotalEquipment((long) equipmentList.size());
        summary.setTotalAssetValue(totalAssetValue);
        summary.setCurrentAssetValue(currentAssetValue);
        summary.setTotalDepreciation(totalDepreciation);
        summary.setAverageDepreciation(equipmentList.isEmpty() ? 0 : totalDepreciation / equipmentList.size());
        summary.setReplacementRecommended(replacementRecommended);

        EquipmentFinancialDashboardResponse response = new EquipmentFinancialDashboardResponse();
        response.setGeneratedAt(LocalDateTime.now());
        response.setGeneratedBy(username);
        response.setSummary(summary);
        response.setEquipment(responses);
        return response;
    }

    public EquipmentFinancialResponse getEquipmentFinancialAnalysis(Long equipmentId, String username) {
        Hospital hospital = getHospitalForUser(username);
        Equipment equipment = equipmentRepository.findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with ID: " + equipmentId));

        EquipmentFinancialResponse response = new EquipmentFinancialResponse();
        response.setEquipmentId(equipment.getId());
        response.setEquipmentName(equipment.getName());
        response.setEquipmentCode(equipment.getEquipmentCode());
        response.setDepartment(equipment.getDepartment());
        response.setCategory(equipment.getCategory() != null ? equipment.getCategory().name() : "OTHER");
        response.setPurchaseDate(equipment.getPurchaseDate());

        double purchaseCost = equipment.getPurchaseCost() != null ? equipment.getPurchaseCost() : 100000.0;
        double salvageValue = equipment.getSalvageValue() != null ? equipment.getSalvageValue() : purchaseCost * 0.10;
        int usefulLife = equipment.getUsefulLifeYears() != null ? equipment.getUsefulLifeYears() : 10;

        double currentValue = DepreciationCalculator.calculateCurrentValue(purchaseCost, salvageValue, usefulLife, equipment.getPurchaseDate());
        double depreciation = DepreciationCalculator.calculateDepreciationAmount(purchaseCost, currentValue);
        double depreciationPercentage = DepreciationCalculator.calculateDepreciationPercentage(purchaseCost, currentValue);
        int remainingLife = DepreciationCalculator.calculateRemainingUsefulLife(usefulLife, equipment.getPurchaseDate());

        response.setPurchaseCost(purchaseCost);
        response.setCurrentValue(currentValue);
        response.setDepreciationAmount(depreciation);
        response.setDepreciationPercentage(depreciationPercentage);
        response.setUsefulLifeYears(usefulLife);
        response.setRemainingUsefulLife(remainingLife);
        response.setSalvageValue(salvageValue);
        response.setDepreciationMethod("STRAIGHT_LINE");
        return response;
    }

    public List<EquipmentFinancialResponse> getReplacementRecommendations(String username) {
        Hospital hospital = getHospitalForUser(username);
        List<Equipment> equipmentList = equipmentRepository.findByHospitalId(hospital.getId());

        List<EquipmentFinancialResponse> recommendations = new ArrayList<>();
        for (Equipment equipment : equipmentList) {
            EquipmentFinancialResponse item = getEquipmentFinancialAnalysis(equipment.getId(), username);
            if (item.getRemainingUsefulLife() <= 1) recommendations.add(item);
        }
        return recommendations;
    }
}
