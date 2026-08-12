package com.medtrack.service;

import com.medtrack.model.MaintenancePolicyRule;
import com.medtrack.repository.MaintenancePolicyRuleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled driver for preventive-maintenance task generation.
 *
 * <p>The scheduler is intentionally thin. Recurrence calculation, equipment matching,
 * idempotency, and task creation remain owned by {@link PreventiveMaintenanceService}.</p>
 */
@Service
@RequiredArgsConstructor
public class PreventiveMaintenanceScheduler {

    private static final Logger log =
            LoggerFactory.getLogger(PreventiveMaintenanceScheduler.class);

    private final MaintenancePolicyRuleRepository ruleRepository;
    private final PreventiveMaintenanceService preventiveMaintenanceService;

    /**
     * Generates upcoming preventive-maintenance tasks for every active policy rule.
     *
     * <p>The generation horizon is based on each rule's configured lead time. Individual
     * rule failures are isolated so that one invalid rule does not stop generation for
     * the remaining hospitals/rules.</p>
     */
    @Scheduled(cron = "${app.maintenance.generation.cron:0 15 * * * *}")
    public void runGenerationSweep() {
        log.info("Starting scheduled preventive-maintenance generation sweep");

        List<MaintenancePolicyRule> rules = ruleRepository.findByActiveTrue();

        int processed = 0;
        int failed = 0;
        int skipped = 0;
        int generated = 0;

        LocalDate today = LocalDate.now();

        for (MaintenancePolicyRule rule : rules) {
            if (rule == null || rule.getId() == null || rule.getHospitalId() == null) {
                skipped++;
                continue;
            }

            if (!Boolean.TRUE.equals(rule.getActive())
                    || Boolean.TRUE.equals(rule.getDeleted())) {
                skipped++;
                continue;
            }

            try {
                LocalDate windowStart = today;
                LocalDate windowEnd = today.plusDays(
                        rule.getLeadTimeDays() != null
                                ? rule.getLeadTimeDays()
                                : 7
                );

                var run = preventiveMaintenanceService.generateTasksForScheduler(
                        rule.getId(),
                        windowStart,
                        windowEnd
                );

                processed++;

                if (run != null) {
                    generated += run.getTasksGenerated() != null
                            ? run.getTasksGenerated()
                            : 0;

                    log.debug(
                            "Preventive-maintenance rule {} generated {} tasks and skipped {} existing tasks",
                            rule.getId(),
                            run.getTasksGenerated(),
                            run.getSkippedExisting()
                    );
                }

            } catch (RuntimeException exception) {
                failed++;

                log.error(
                        "Scheduled preventive-maintenance generation failed for rule {} " +
                                "in hospital {}",
                        rule.getId(),
                        rule.getHospitalId(),
                        exception
                );
            }
        }

        log.info(
                "Completed scheduled preventive-maintenance generation sweep: " +
                        "rulesProcessed={}, rulesFailed={}, rulesSkipped={}, tasksGenerated={}",
                processed,
                failed,
                skipped,
                generated
        );
    }
}