package com.medtrack.auth.microsegmentation.controller;

import com.medtrack.auth.microsegmentation.dto.*;
import com.medtrack.auth.microsegmentation.service.MicrosegmentationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Zero-Trust Microsegmentation & Software-Defined Perimeter (SDP).
 */
@RestController
@RequestMapping("/api/auth/microsegmentation")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Tag(name = "Microsegmentation & SDP Subsystem", description = "APIs for network microsegmentation rules, posture-aware traffic controls, and encrypted SDP tunnel orchestration.")
public class MicrosegmentationController {

    private final MicrosegmentationService microsegmentationService;

    @GetMapping("/rules")
    @Operation(summary = "Get All Microsegmentation Rules", description = "Retrieves all configured network segment isolation policies.")
    public ResponseEntity<List<MicrosegmentationPolicyResponse>> getAllPolicies() {
        List<MicrosegmentationPolicyResponse> policies = microsegmentationService.getAllPolicies();
        return ResponseEntity.ok(policies);
    }

    @PostMapping("/rules")
    @Operation(summary = "Create Microsegmentation Rule", description = "Creates a new network isolation rule restricting segment-to-segment traffic.")
    public ResponseEntity<MicrosegmentationPolicyResponse> createRule(@Valid @RequestBody CreateMicrosegmentationRuleRequest request) {
        MicrosegmentationPolicyResponse response = microsegmentationService.createRule(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/rules/{ruleId}/toggle")
    @Operation(summary = "Toggle Rule Status", description = "Enables or disables a microsegmentation policy rule.")
    public ResponseEntity<MicrosegmentationPolicyResponse> toggleRuleStatus(@PathVariable String ruleId, @RequestParam boolean active) {
        MicrosegmentationPolicyResponse response = microsegmentationService.toggleRuleStatus(ruleId, active);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tunnels")
    @Operation(summary = "Get All SDP Tunnels", description = "Retrieves active and terminated Software-Defined Perimeter encrypted tunnel sessions.")
    public ResponseEntity<List<SdpTunnelSessionResponse>> getAllTunnels() {
        List<SdpTunnelSessionResponse> tunnels = microsegmentationService.getAllTunnels();
        return ResponseEntity.ok(tunnels);
    }

    @PostMapping("/tunnels/establish")
    @Operation(summary = "Establish SDP Tunnel", description = "Establishes a WireGuard/IPsec encrypted SDP tunnel session to a protected segment.")
    public ResponseEntity<SdpTunnelSessionResponse> establishTunnel(@Valid @RequestBody EstablishSdpTunnelRequest request) {
        SdpTunnelSessionResponse response = microsegmentationService.establishTunnel(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate")
    @Operation(summary = "Evaluate Traffic Access", description = "Performs real-time zero-trust packet access evaluation between source and destination segments.")
    public ResponseEntity<Map<String, Object>> evaluateTrafficAccess(@RequestParam String sourceSegment,
                                                                    @RequestParam String destinationSegment,
                                                                    @RequestParam(defaultValue = "TCP") String protocol,
                                                                    @RequestParam(defaultValue = "443") String port) {
        Map<String, Object> response = microsegmentationService.evaluateTrafficAccess(sourceSegment, destinationSegment, protocol, port);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/quarantine/{sourceSegment}")
    @Operation(summary = "Quarantine Source Segment", description = "Creates emergency isolation policy blocking all traffic to/from compromised segment.")
    public ResponseEntity<Map<String, Object>> quarantineSourceSegment(@PathVariable String sourceSegment) {
        Map<String, Object> response = microsegmentationService.quarantineSourceSegment(sourceSegment, "SECURITY_OPERATOR");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/ebpf/matrix")
    @Operation(summary = "Compile eBPF Policy Matrix", description = "Compiles active rules into Linux kernel eBPF bytecode map matrix.")
    public ResponseEntity<Map<String, Object>> compileEbpfPolicyMatrix() {
        Map<String, Object> response = microsegmentationService.compileEbpfPolicyMatrix();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get Microsegmentation Audit Metrics", description = "Retrieves NIST SP 800-207 Zero Trust audit metrics and active SDP tunnel stats.")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> metrics = microsegmentationService.getMicrosegmentationAuditMetrics();
        return ResponseEntity.ok(metrics);
    }
}

