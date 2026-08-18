package com.medtrack.cardiology.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;

/**
 * Enterprise Service for Cardiovascular Telemetry & Invasive Hemodynamics Overwatch Hub
 * Subsystem for MedTrack Medical Platform.
 * Standards: PAC Swan-Ganz, Impella CP/5.5, IABP 1:1, Cardiac Power Output (CPO)
 */
@Service
@Transactional
public class CardiovascularHemodynamicsService {

    public Map<String, Object> calculateHemodynamicProfile(String patientId, double map, double co, double pawp, double cvp) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("patientId", patientId);
        profile.put("timestamp", System.currentTimeMillis());
        
        // Cardiac Power Output (CPO) Watts = MAP * CO / 451
        double cpo = (map * co) / 451.0;
        
        // Systemic Vascular Resistance (SVR) dynes/sec/cm-5 = (MAP - CVP) / CO * 80
        double svr = ((map - cvp) / (co > 0 ? co : 1.0)) * 80.0;

        profile.put("cpoWatts", Math.round(cpo * 100.0) / 100.0);
        profile.put("svrDynes", Math.round(svr));
        profile.put("cardiogenicShockRisk", cpo < 0.6 ? "HIGH_RISK_STAGE_D" : "COMPENSATED");
        profile.put("pawpStatus", pawp > 18 ? "LEFT_VENTRICULAR_CONGESTION" : "NORMAL_FILLING_PRESSURE");

        return profile;
    }
}
