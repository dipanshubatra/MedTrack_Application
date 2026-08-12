package com.medtrack.auth.jwt.dto;

import java.util.List;

public class JwtTokenIssueRequest {

    private String userId;
    private List<String> roles;
    private String audience;
    private String signatureAlgorithm; // RS256 or ES256

    public JwtTokenIssueRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getSignatureAlgorithm() { return signatureAlgorithm; }
    public void setSignatureAlgorithm(String signatureAlgorithm) { this.signatureAlgorithm = signatureAlgorithm; }
}
