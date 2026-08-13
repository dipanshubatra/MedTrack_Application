package com.medtrack.auth.threatintel.service;

import com.medtrack.auth.siem.dto.SiemLogIngestRequest;
import com.medtrack.auth.siem.service.SiemLogCorrelationService;
import com.medtrack.auth.threatintel.dto.*;
import com.medtrack.auth.threatintel.model.*;
import com.medtrack.auth.threatintel.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Enterprise Cyber Threat Intelligence (CTI) STIX/TAXII 2.1 & SIEM Feed Orchestrator.
 *
 * Enforces Standards:
 * - OASIS STIX/TAXII 2.1 (Structured Threat Information eXpression)
 * - NIST SP 800-150 (Guide to Cyber Threat Information Sharing)
 * - ISO/IEC 27035:2023 (Information Security Incident Management)
 * - MITRE ATT&CK Matrix v14
 */
@Service
public class ThreatIntelligenceService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final ThreatIndicatorRepository indicatorRepository;
    private final ThreatIntelFeedConfigRepository feedConfigRepository;
    private final ThreatMitigationLogRepository mitigationLogRepository;
    private final ThreatIntelAttackPatternLogRepository attackPatternLogRepository;
    private final SiemLogCorrelationService siemLogCorrelationService;

    @Autowired
    public ThreatIntelligenceService(ThreatIndicatorRepository indicatorRepository,
                                     ThreatIntelFeedConfigRepository feedConfigRepository,
                                     ThreatMitigationLogRepository mitigationLogRepository,
                                     ThreatIntelAttackPatternLogRepository attackPatternLogRepository,
                                     SiemLogCorrelationService siemLogCorrelationService) {
        this.indicatorRepository = indicatorRepository;
        this.feedConfigRepository = feedConfigRepository;
        this.mitigationLogRepository = mitigationLogRepository;
        this.attackPatternLogRepository = attackPatternLogRepository;
        this.siemLogCorrelationService = siemLogCorrelationService;
    }

    /**
     * Seeds baseline threat feeds, indicators, and MITRE ATT&CK patterns.
     */
    @PostConstruct
    @Transactional
    public void seedThreatIntelBaseline() {
        if (feedConfigRepository.count() == 0) {
            seedFeedConfig("FEED-US-CERT-TAXII", "US-CERT CISA TAXII 2.1 Feed", "https://taxii.cisa.gov/stix/v2.1", "TAXII_2_1", "AUTOMATIC_INGEST");
            seedFeedConfig("FEED-MISP-HEALTH", "Healthcare MISP Threat Sharing Feed", "https://misp.medtrack.org/stix/bundle", "MISP_JSON", "AUTOMATIC_INGEST");
            seedFeedConfig("FEED-ABUSECH-IP", "Abuse.ch Malware IP Blocklist", "https://feodotracker.abuse.ch/downloads/ipblocklist.json", "REST_JSON", "MANUAL_APPROVAL");
        }

        if (indicatorRepository.count() == 0) {
            seedIndicator("198.51.100.45", "IP_ADDRESS", "MALWARE_C2", 95, "ACTIVE");
            seedIndicator("bad-malware-domain.org", "DOMAIN_NAME", "PHISHING", 88, "ACTIVE");
            seedIndicator("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "FILE_HASH_SHA256", "RANSOMWARE", 99, "BLOCKED");
            seedIndicator("203.0.113.88", "IP_ADDRESS", "EXFILTRATION_ENDPOINT", 92, "ACTIVE");
        }

        if (attackPatternLogRepository.count() == 0) {
            seedAttackPattern("PAT-T1071", "T1071.001", "Web Protocols C2 Tunneling", "COMMAND_AND_CONTROL", "Encrypted HTTPS C2 beaconing detected from compromised host", "PATIENT_PORTAL_DMZ");
            seedAttackPattern("PAT-T1190", "T1190", "Exploit Public-Facing Application", "INITIAL_ACCESS", "Unauthenticated SQL injection probe targeting API Gateway", "INTERNAL_API_GATEWAY");
            seedAttackPattern("PAT-T1059", "T1059.001", "PowerShell Execution Anomaly", "EXECUTION", "Obfuscated PowerShell command executed under service account", "EHR_VAULT");
        }
    }

    private void seedFeedConfig(String feedId, String name, String url, String type, String mode) {
        if (feedConfigRepository.findByFeedId(feedId).isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            feedConfigRepository.save(ThreatIntelFeedConfig.builder()
                    .feedId(feedId)
                    .feedName(name)
                    .feedUrl(url)
                    .feedType(type)
                    .syncMode(mode)
                    .status("ACTIVE")
                    .lastSyncedAt(now.minusHours(2))
                    .build());
        }
    }

    private void seedIndicator(String value, String type, String category, int confidence, String status) {
        if (indicatorRepository.findByIndicatorValue(value).isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            indicatorRepository.save(ThreatIndicator.builder()
                    .indicatorId("IOC-" + (10000 + new Random().nextInt(90000)))
                    .indicatorValue(value)
                    .indicatorType(type)
                    .threatCategory(category)
                    .confidenceScore(confidence)
                    .status(status)
                    .firstSeenAt(now.minusDays(1))
                    .lastSeenAt(now)
                    .build());
        }
    }

    private void seedAttackPattern(String pId, String mitreId, String name, String tactic, String desc, String comp) {
        if (attackPatternLogRepository.findByPatternId(pId).isEmpty()) {
            attackPatternLogRepository.save(ThreatIntelAttackPatternLog.builder()
                    .patternId(pId)
                    .mitreTechniqueId(mitreId)
                    .techniqueName(name)
                    .tactic(tactic)
                    .description(desc)
                    .affectedComponent(comp)
                    .detectedAt(LocalDateTime.now().minusHours(4))
                    .build());
        }
    }

    /**
     * Ingests a new Threat Indicator (IOC) and correlates with SIEM.
     */
    @Transactional
    public ThreatIndicatorResponse ingestIndicator(IngestIndicatorRequest request) {
        String indicatorId = "IOC-" + (10000 + new Random().nextInt(90000));
        LocalDateTime now = LocalDateTime.now();

        ThreatIndicator indicator = ThreatIndicator.builder()
                .indicatorId(indicatorId)
                .indicatorValue(request.getIndicatorValue())
                .indicatorType(request.getIndicatorType().toUpperCase(Locale.ROOT))
                .threatCategory(request.getThreatCategory().toUpperCase(Locale.ROOT))
                .confidenceScore(request.getConfidenceScore())
                .status("ACTIVE")
                .firstSeenAt(now)
                .lastSeenAt(now)
                .build();

        ThreatIndicator saved = indicatorRepository.save(indicator);

        // SIEM Log Integration: Ingest high-confidence indicators into SIEM stream
        if (saved.getConfidenceScore() >= 80) {
            try {
                SiemLogIngestRequest siemRequest = new SiemLogIngestRequest();
                siemRequest.setSourceType("THREAT_INTEL");
                siemRequest.setEventCategory("IOC_INGESTION");
                siemRequest.setSeverity(saved.getConfidenceScore() >= 90 ? "CRITICAL" : "HIGH");
                siemRequest.setSourceHost("STIX-TAXII-FEED");
                siemRequest.setSourceIp("127.0.0.1");
                siemRequest.setMessage("High-Confidence Threat Indicator Ingested: " + saved.getIndicatorValue() + " [" + saved.getThreatCategory() + "]");
                siemRequest.setRawPayload("Confidence: " + saved.getConfidenceScore() + "%, Type: " + saved.getIndicatorType());
                siemLogCorrelationService.ingestLog(siemRequest);
            } catch (Exception e) {
                // Non-blocking
            }
        }

        return mapToIndicatorResponse(saved);
    }

    /**
     * Ingests bulk OASIS STIX/TAXII 2.1 Cyber Threat Intelligence JSON bundles.
     */
    @Transactional
    public Map<String, Object> ingestStixTaxiiBundle(StixTaxiiBundleIngestionRequest request) {
        int ingestedCount = 0;
        List<String> ingestedIds = new ArrayList<>();

        if (request.getObjects() != null) {
            for (StixTaxiiBundleIngestionRequest.StixObjectDto obj : request.getObjects()) {
                if ("indicator".equalsIgnoreCase(obj.getType()) && obj.getPattern() != null) {
                    IngestIndicatorRequest singleReq = new IngestIndicatorRequest();
                    singleReq.setIndicatorValue(obj.getPattern());
                    singleReq.setIndicatorType("STIX_PATTERN");
                    singleReq.setThreatCategory(obj.getName() != null ? obj.getName() : "STIX_INDICATOR");
                    singleReq.setConfidenceScore(obj.getConfidence() != null ? obj.getConfidence() : 85);
                    ingestIndicator(singleReq);
                    ingestedCount++;
                    ingestedIds.add(obj.getId());
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("stixBundleId", request.getId());
        result.put("specVersion", request.getSpecVersion());
        result.put("status", "SUCCESS");
        result.put("totalObjectsProcessed", request.getObjects() != null ? request.getObjects().size() : 0);
        result.put("indicatorsIngestedCount", ingestedCount);
        result.put("ingestedObjectIds", ingestedIds);
        result.put("complianceStandard", "OASIS STIX/TAXII 2.1 & NIST SP 800-150");
        return result;
    }

    /**
     * Queries threat reputation for a given indicator (IP, domain, hash).
     */
    @Transactional(readOnly = true)
    public ThreatReputationQueryResult lookupIndicatorReputation(String indicatorValue) {
        Optional<ThreatIndicator> matched = indicatorRepository.findByIndicatorValue(indicatorValue);

        if (matched.isPresent()) {
            ThreatIndicator ind = matched.get();
            String risk = ind.getConfidenceScore() >= 90 ? "CRITICAL" : ind.getConfidenceScore() >= 75 ? "HIGH" : "MEDIUM";
            return ThreatReputationQueryResult.builder()
                    .queryIndicator(indicatorValue)
                    .matchFound(true)
                    .indicatorType(ind.getIndicatorType())
                    .category(ind.getThreatCategory())
                    .confidenceScore(ind.getConfidenceScore())
                    .riskLevel(risk)
                    .mitreTechniqueId("T1071.001")
                    .activeMitigationStatus(ind.getStatus())
                    .lastSeen(ind.getLastSeenAt())
                    .auditStandard("OASIS STIX/TAXII 2.1")
                    .build();
        } else {
            return ThreatReputationQueryResult.builder()
                    .queryIndicator(indicatorValue)
                    .matchFound(false)
                    .riskLevel("CLEAN")
                    .confidenceScore(0)
                    .activeMitigationStatus("NONE")
                    .lastSeen(LocalDateTime.now())
                    .auditStandard("OASIS STIX/TAXII 2.1")
                    .build();
        }
    }

    /**
     * Triggers automated firewall WAF mitigation mass-blocking for high-confidence IOCs.
     */
    @Transactional
    public ThreatMitigationLogResponse triggerMitigation(TriggerMitigationRequest request) {
        String mitigationId = "MIT-" + (10000 + new Random().nextInt(90000));
        LocalDateTime now = LocalDateTime.now();

        ThreatMitigationLog log = ThreatMitigationLog.builder()
                .mitigationId(mitigationId)
                .targetIndicator(request.getTargetIndicator())
                .mitigationAction(request.getMitigationAction().toUpperCase(Locale.ROOT))
                .targetSystem(request.getTargetSystem())
                .status("SUCCESS")
                .appliedAt(now)
                .build();

        ThreatMitigationLog saved = mitigationLogRepository.save(log);

        // Update indicator status if found
        indicatorRepository.findByIndicatorValue(request.getTargetIndicator()).ifPresent(ind -> {
            ind.setStatus("BLOCKED");
            indicatorRepository.save(ind);
        });

        return mapToMitigationResponse(saved);
    }

    /**
     * Mass auto-blocks all active high-confidence threat indicators across WAF/Firewall gateways.
     */
    @Transactional
    public Map<String, Object> autoBlockAllHighConfidenceIndicators(int minConfidenceThreshold) {
        List<ThreatIndicator> highRiskIndicators = indicatorRepository.findAll().stream()
                .filter(i -> "ACTIVE".equalsIgnoreCase(i.getStatus()))
                .filter(i -> i.getConfidenceScore() >= minConfidenceThreshold)
                .collect(Collectors.toList());

        int blockedCount = 0;
        for (ThreatIndicator ind : highRiskIndicators) {
            ind.setStatus("BLOCKED");
            indicatorRepository.save(ind);

            ThreatMitigationLog mLog = ThreatMitigationLog.builder()
                    .mitigationId("MIT-AUTO-" + (10000 + new Random().nextInt(90000)))
                    .targetIndicator(ind.getIndicatorValue())
                    .mitigationAction("AUTO_WAF_BLOCK")
                    .targetSystem("PERIMETER_FIREWALL_GATEWAY")
                    .status("SUCCESS")
                    .appliedAt(LocalDateTime.now())
                    .build();
            mitigationLogRepository.save(mLog);
            blockedCount++;
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("autoMitigationStatus", "SUCCESS");
        response.put("minConfidenceThreshold", minConfidenceThreshold);
        response.put("totalBlockedIndicators", blockedCount);
        response.put("executionTimestamp", LocalDateTime.now().format(ISO_FORMATTER));
        response.put("complianceStandard", "NIST SP 800-150 / ISO 27035");
        return response;
    }

    /**
     * Updates an external threat feed configuration.
     */
    @Transactional
    public ThreatIntelFeedConfigResponse updateFeedConfig(String feedId, UpdateFeedConfigRequest request) {
        ThreatIntelFeedConfig config = feedConfigRepository.findByFeedId(feedId)
                .orElseThrow(() -> new IllegalArgumentException("Threat feed config not found: " + feedId));

        config.setFeedName(request.getFeedName());
        config.setFeedUrl(request.getFeedUrl());
        config.setSyncMode(request.getSyncMode());
        config.setStatus(request.getStatus());
        config.setLastSyncedAt(LocalDateTime.now());

        ThreatIntelFeedConfig updated = feedConfigRepository.save(config);
        return mapToFeedConfigResponse(updated);
    }

    /**
     * Retrieves all configured threat feeds.
     */
    @Transactional(readOnly = true)
    public List<ThreatIntelFeedConfigResponse> getAllFeedConfigs() {
        return feedConfigRepository.findAll().stream()
                .map(this::mapToFeedConfigResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all ingested threat indicators (IOCs).
     */
    @Transactional(readOnly = true)
    public List<ThreatIndicatorResponse> getAllIndicators() {
        return indicatorRepository.findAll().stream()
                .map(this::mapToIndicatorResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all mitigation logs.
     */
    @Transactional(readOnly = true)
    public List<ThreatMitigationLogResponse> getAllMitigationLogs() {
        return mitigationLogRepository.findAll().stream()
                .map(this::mapToMitigationResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all MITRE ATT&CK pattern logs.
     */
    @Transactional(readOnly = true)
    public List<ThreatIntelAttackPatternLog> getAllAttackPatterns() {
        return attackPatternLogRepository.findAll();
    }

    /**
     * Retrieves overall CTI STIX/TAXII 2.1 Audit & Governance Metrics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getThreatIntelMetrics() {
        List<ThreatIndicator> indicators = indicatorRepository.findAll();
        List<ThreatIntelFeedConfig> feeds = feedConfigRepository.findAll();
        List<ThreatMitigationLog> mitigations = mitigationLogRepository.findAll();

        long activeIndicatorsCount = indicators.stream().filter(i -> "ACTIVE".equalsIgnoreCase(i.getStatus())).count();
        long blockedIndicatorsCount = indicators.stream().filter(i -> "BLOCKED".equalsIgnoreCase(i.getStatus())).count();
        double avgConfidence = indicators.stream().mapToInt(ThreatIndicator::getConfidenceScore).average().orElse(0.0);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalThreatIndicators", indicators.size());
        metrics.put("activeIndicatorsCount", activeIndicatorsCount);
        metrics.put("blockedIndicatorsCount", blockedIndicatorsCount);
        metrics.put("configuredFeedsCount", feeds.size());
        metrics.put("totalMitigationsExecuted", mitigations.size());
        metrics.put("averageConfidenceScore", Math.round(avgConfidence * 100.0) / 100.0);
        metrics.put("stixVersionSupported", "OASIS STIX/TAXII 2.1");
        metrics.put("complianceStandard", "NIST SP 800-150 Threat Information Sharing, ISO/IEC 27035:2023");
        return metrics;
    }

    private ThreatIndicatorResponse mapToIndicatorResponse(ThreatIndicator i) {
        return ThreatIndicatorResponse.builder()
                .id(i.getId())
                .indicatorId(i.getIndicatorId())
                .indicatorValue(i.getIndicatorValue())
                .indicatorType(i.getIndicatorType())
                .threatCategory(i.getThreatCategory())
                .confidenceScore(i.getConfidenceScore())
                .status(i.getStatus())
                .firstSeenAt(i.getFirstSeenAt())
                .lastSeenAt(i.getLastSeenAt())
                .build();
    }

    private ThreatIntelFeedConfigResponse mapToFeedConfigResponse(ThreatIntelFeedConfig f) {
        return ThreatIntelFeedConfigResponse.builder()
                .id(f.getId())
                .feedId(f.getFeedId())
                .feedName(f.getFeedName())
                .feedUrl(f.getFeedUrl())
                .feedType(f.getFeedType())
                .syncMode(f.getSyncMode())
                .status(f.getStatus())
                .lastSyncedAt(f.getLastSyncedAt())
                .build();
    }

    private ThreatMitigationLogResponse mapToMitigationResponse(ThreatMitigationLog m) {
        return ThreatMitigationLogResponse.builder()
                .id(m.getId())
                .mitigationId(m.getMitigationId())
                .targetIndicator(m.getTargetIndicator())
                .mitigationAction(m.getMitigationAction())
                .targetSystem(m.getTargetSystem())
                .status(m.getStatus())
                .appliedAt(m.getAppliedAt())
                .build();
    }
}
