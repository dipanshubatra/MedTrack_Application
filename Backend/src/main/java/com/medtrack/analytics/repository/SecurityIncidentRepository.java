package com.medtrack.analytics.repository;

import com.medtrack.analytics.model.SecurityIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SecurityIncidentRepository extends JpaRepository<SecurityIncident, UUID> {
}
