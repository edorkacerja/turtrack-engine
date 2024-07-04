package com.turtrack.dataprocessorservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final VehicleProcessingService vehicleProcessingService;
    private final DailyRateProcessingService dailyRateProcessingService;

    @KafkaListener(topics = "vehicle-detail-topic", groupId = "turtrack-group")
    public void consumeVehicles(Map<String, Object> message) {
        System.out.println("Received vehicle message: " + message);
        vehicleProcessingService.processAndForwardVehicle(message);
    }

    @KafkaListener(topics = "vehicle-daily-rate-and-availability-topic", groupId = "turtrack-group")
    public void consumePricing(Map<String, Object> message) {
        System.out.println("Received pricing message: " + message);
        dailyRateProcessingService.processAndForwardDailyRates(message);
    }
}