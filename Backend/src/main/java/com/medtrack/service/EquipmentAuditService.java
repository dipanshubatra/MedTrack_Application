package com.medtrack.service;

import com.medtrack.auth.model.User;
import com.medtrack.auth.repository.UserRepository;
import com.medtrack.dto.EquipmentAuditResponse;
import com.medtrack.exception.ResourceNotFoundException;
import com.medtrack.model.Equipment;
import com.medtrack.model.EquipmentAudit;
import com.medtrack.model.Hospital;
import com.medtrack.repository.EquipmentAuditRepository;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentAuditService {

    private static final DateTimeFormatter TIMESTAMP_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final EquipmentAuditRepository equipmentAuditRepository;
    private final EquipmentRepository equipmentRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    private Hospital getHospitalForUser(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username or email is required");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier.toLowerCase(java.util.Locale.ROOT)))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return hospitalRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital profile not found for user"));
    }

    public void logAction(
            Equipment equipment,
            Hospital hospital,
            String username,
            String action,
            String changedFields,
            String previousValue,
            String newValue
    ) {

        EquipmentAudit audit = EquipmentAudit.builder()
                .equipmentId(equipment.getId())
                .hospital(hospital)
                .username(username)
                .action(action)
                .changedFields(changedFields)
                .previousValue(previousValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .build();

        equipmentAuditRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getEquipmentHistory(Long equipmentId, String username) {
        if (equipmentId == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }
        Hospital hospital = getHospitalForUser(username);
        equipmentRepository.findByIdAndHospitalId(equipmentId, hospital.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Equipment not found or access denied"));

        return equipmentAuditRepository
                .findByEquipmentIdAndHospitalIdOrderByTimestampDesc(equipmentId, hospital.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getEquipmentHistory(Long equipmentId) {
        if (equipmentId == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }
        return equipmentAuditRepository
                .findByEquipmentIdOrderByTimestampDesc(equipmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getHospitalHistory(Long hospitalId) {
        if (hospitalId == null) {
            throw new IllegalArgumentException("Hospital ID is required");
        }
        return equipmentAuditRepository
                .findByHospitalIdOrderByTimestampDesc(hospitalId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getHospitalHistory(String username) {
        Hospital hospital = getHospitalForUser(username);
        return equipmentAuditRepository
                .findByHospitalIdOrderByTimestampDesc(hospital.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentAuditResponse> getFilteredHospitalHistory(
            String username,
            String action,
            String filterUser,
            LocalDateTime start,
            LocalDateTime end
    ) {
        Hospital hospital = getHospitalForUser(username);
        List<EquipmentAudit> audits;

        if (action != null && !action.isBlank()) {
            audits = equipmentAuditRepository.findByHospitalIdAndActionOrderByTimestampDesc(
                    hospital.getId(), action.trim());
        } else if (filterUser != null && !filterUser.isBlank()) {
            audits = equipmentAuditRepository.findByHospitalIdAndUsernameOrderByTimestampDesc(
                    hospital.getId(), filterUser.trim());
        } else if (start != null && end != null) {
            audits = equipmentAuditRepository.findByHospitalIdAndTimestampBetweenOrderByTimestampDesc(
                    hospital.getId(), start, end);
        } else {
            audits = equipmentAuditRepository.findByHospitalIdOrderByTimestampDesc(hospital.getId());
        }

        return audits.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public String exportAuditHistoryCsv(String username) {
        List<EquipmentAuditResponse> logs = getHospitalHistory(username);
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Equipment ID,Username,Action,Changed Fields,Previous Value,New Value,Timestamp\n");

        for (EquipmentAuditResponse log : logs) {
            csv.append(log.getId()).append(",")
                    .append(log.getEquipmentId() != null ? log.getEquipmentId() : "").append(",")
                    .append(escapeCsv(log.getUsername())).append(",")
                    .append(escapeCsv(log.getAction())).append(",")
                    .append(escapeCsv(log.getChangedFields())).append(",")
                    .append(escapeCsv(log.getPreviousValue())).append(",")
                    .append(escapeCsv(log.getNewValue())).append(",")
                    .append(log.getTimestamp() != null ? log.getTimestamp().format(TIMESTAMP_FORMATTER) : "")
                    .append("\n");
        }
        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = value.replace("\"", "\"\"");
        if (sanitized.contains(",") || sanitized.contains("\n") || sanitized.contains("\"")) {
            return "\"" + sanitized + "\"";
        }
        return sanitized;
    }

    private EquipmentAuditResponse mapToResponse(EquipmentAudit audit) {

        return EquipmentAuditResponse.builder()
                .id(audit.getId())
                .equipmentId(audit.getEquipmentId())
                .username(audit.getUsername())
                .action(audit.getAction())
                .changedFields(audit.getChangedFields())
                .previousValue(audit.getPreviousValue())
                .newValue(audit.getNewValue())
                .timestamp(audit.getTimestamp())
                .build();
    }
}