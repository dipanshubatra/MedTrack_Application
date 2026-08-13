package com.medtrack.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import static com.medtrack.validation.MaintenanceValidationLimits.NOTES_MAX_LENGTH;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleAmendmentRequest {

    @NotNull(message = "New deadline is required")
    @Future(message = "New deadline must be in the future")
    private LocalDate newDeadline;

    private LocalDate deadline;
    private String maintenanceType;
    private String description;
    private String priority;
    private Integer recurrencePeriodDays;

    @NotBlank(message = "Amendment reason is required")
    @Size(
            max = NOTES_MAX_LENGTH,
            message = "Amendment reason must not exceed 16000 characters"
    )
    private String reason;

    public LocalDate getDeadline() {
        return deadline != null ? deadline : newDeadline;
    }
}