package com.medtrack.service;

import com.medtrack.model.InventoryItem;
import com.medtrack.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDate;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class PredictiveSupplyService {
    private static final Logger logger = Logger.getLogger(PredictiveSupplyService.class.getName());
    
    @Autowired
    private InventoryRepository inventoryRepository;
    
    // Simulate ML model inference connection
    private final String ML_MODEL_ENDPOINT = "http://ml-serving:8501/v1/models/supply_predict:predict";

    public Map<Long, Double> generateForecasts() {
        logger.info("Starting predictive supply forecasting pipeline.");
        List<InventoryItem> items = inventoryRepository.findAll();
        Map<Long, Double> forecasts = new HashMap<>();
        
        for (InventoryItem item : items) {
            double velocity = calculateVelocity(item);
            double seasonality = getSeasonalityMultiplier(item, LocalDate.now().getMonthValue());
            double predictedShortage = velocity * seasonality * 1.5; // Safety margin
            forecasts.put(item.getId(), predictedShortage);
        }
        return forecasts;
    }
    
    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM everyday
    public void automatedRestockingJob() {
        Map<Long, Double> forecasts = generateForecasts();
        List<InventoryItem> items = inventoryRepository.findAll();
        
        for (InventoryItem item : items) {
            Double predictedDemand = forecasts.get(item.getId());
            if (predictedDemand != null && (item.getQuantity() - predictedDemand) < 10.0) { // Using 10.0 as mock threshold
                int reorderAmount = (int) Math.ceil(predictedDemand - item.getQuantity() + 50.0);
                logger.info(String.format("Triggering automated PO for item %d for amount %d", item.getId(), reorderAmount));
                // Call external PO creation service here
            }
        }
    }
    
    private double calculateVelocity(InventoryItem item) {
        // Implementation for consumption velocity based on historical logs
        return item.getQuantity() * 0.05; // Mock calculation
    }
    
    private double getSeasonalityMultiplier(InventoryItem item, int currentMonth) {
        // Fetch seasonal variations (e.g. flu season spikes)
        if (currentMonth >= 10 || currentMonth <= 2) {
            return 1.3;
        }
        return 1.0;
    }
}
