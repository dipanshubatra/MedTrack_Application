package com.medtrack.auth.threatintel.controller;

import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.model.ThreatIntelAttackPatternLog;
import com.medtrack.auth.threatintel.service.ThreatIntelligenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Cyber Threat Intelligence (CTI) STIX/TAXII 2.1 & SIEM Feed Orchestration.
 */
@RestController
@RequestMapping("/api/auth/threatintel")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Cyber Threat Intelligence Subsystem", description = "APIs for STIX/TAXII 2.1 threat feeds, IOC correlation, reputation lookup, and automated firewall mitigations.")
public class ThreatIntelligenceController {

    private final ThreatIntelligenceService threatIntelligenceService;

    @GetMapping("/feeds")
    @Operation(summary = "Get All Threat Feeds", description = "Retrieves all configured external STIX/TAXII threat intelligence feed subscriptions.")
    public ResponseEntity<List<ThreatIntelFeedConfigResponse>> getAllFeedConfigs() {
        List<ThreatIntelFeedConfigResponse> feeds = threatIntelligenceService.getAllFeedConfigs();
        return ResponseEntity.ok(feeds);
    }

    @PutMapping("/feeds/{feedId}")
    @Operation(summary = "Update Threat Feed Config", description = "Updates settings and sync mode for an external threat intelligence feed.")
    public ResponseEntity<ThreatIntelFeedConfigResponse> updateFeedConfig(@PathVariable String feedId, @Valid @RequestBody UpdateFeedConfigRequest request) {
        ThreatIntelFeedConfigResponse response = threatIntelligenceService.updateFeedConfig(feedId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/indicators")
    @Operation(summary = "Get All Threat Indicators (IOCs)", description = "Retrieves all ingested threat indicators including IP addresses, domains, and SHA256 file hashes.")
    public ResponseEntity<List<ThreatIndicatorResponse>> getAllIndicators() {
        List<ThreatIndicatorResponse> indicators = threatIntelligenceService.getAllIndicators();
        return ResponseEntity.ok(indicators);
    }

    @PostMapping("/indicators")
    @Operation(summary = "Ingest Threat Indicator", description = "Manually or programmatically ingests a new threat indicator IOC into the correlation engine.")
    public ResponseEntity<ThreatIndicatorResponse> ingestIndicator(@Valid @RequestBody IngestIndicatorRequest request) {
        ThreatIndicatorResponse response = threatIntelligenceService.ingestIndicator(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stix/bundle")
    @Operation(summary = "Ingest STIX 2.1 Bundle", description = "Bulk ingests an OASIS STIX/TAXII 2.1 JSON Threat Intelligence bundle.")
    public ResponseEntity<Map<String, Object>> ingestStixTaxiiBundle(@Valid @RequestBody StixTaxiiBundleIngestionRequest request) {
        Map<String, Object> response = threatIntelligenceService.ingestStixTaxiiBundle(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/lookup/{indicatorValue}")
    @Operation(summary = "Lookup Indicator Reputation", description = "Performs real-time threat reputation query for an IP address, domain name, or file hash.")
    public ResponseEntity<ThreatReputationQueryResult> lookupIndicatorReputation(@PathVariable String indicatorValue) {
        ThreatReputationQueryResult result = threatIntelligenceService.lookupIndicatorReputation(indicatorValue);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/mitigations")
    @Operation(summary = "Get All Mitigation Logs", description = "Retrieves logs of automated WAF and perimeter firewall block actions.")
    public ResponseEntity<List<ThreatMitigationLogResponse>> getAllMitigationLogs() {
        List<ThreatMitigationLogResponse> mitigations = threatIntelligenceService.getAllMitigationLogs();
        return ResponseEntity.ok(mitigations);
    }

    @PostMapping("/mitigate")
    @Operation(summary = "Trigger Firewall Mitigation", description = "Triggers an automated perimeter WAF or firewall rule to block a malicious indicator.")
    public ResponseEntity<ThreatMitigationLogResponse> triggerMitigation(@Valid @RequestBody TriggerMitigationRequest request) {
        ThreatMitigationLogResponse response = threatIntelligenceService.triggerMitigation(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mitigate/auto-block-all")
    @Operation(summary = "Mass Auto-Block Indicators", description = "Mass-mitigates and blocks all active high-confidence IOCs across perimeter firewalls.")
    public ResponseEntity<Map<String, Object>> autoBlockAllHighConfidenceIndicators(@RequestParam(defaultValue = "85") int minConfidenceThreshold) {
        Map<String, Object> response = threatIntelligenceService.autoBlockAllHighConfidenceIndicators(minConfidenceThreshold);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patterns")
    @Operation(summary = "Get MITRE ATT&CK Patterns", description = "Retrieves mapped MITRE ATT&CK Matrix v14 techniques and tactics.")
    public ResponseEntity<List<ThreatIntelAttackPatternLog>> getAllAttackPatterns() {
        List<ThreatIntelAttackPatternLog> patterns = threatIntelligenceService.getAllAttackPatterns();
        return ResponseEntity.ok(patterns);
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get CTI Audit & Governance Metrics", description = "Retrieves NIST SP 800-150 and ISO/IEC 27035:2023 threat information metrics.")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = threatIntelligenceService.getThreatIntelMetrics();
        return ResponseEntity.ok(metrics);
    }
}
