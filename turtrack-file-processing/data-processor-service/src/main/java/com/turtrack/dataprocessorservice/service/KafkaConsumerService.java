package com.turtrack.dataprocessorservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final VehicleSkeletonProcessingService vehicleSkeletonProcessingService;
    private final VehicleProcessingService vehicleProcessingService;
    private final DailyRateProcessingService dailyRateProcessingService;

    @KafkaListener(topics = "SCRAPED-vehicle-skeleton-topic", groupId = "turtrack-group")
    public void consumeVehicleSkeletons(Map<String, Object> message) {
        System.out.println("Received vehicle skeleton message: " + message);
        vehicleSkeletonProcessingService.processAndForwardVehicleSkeleton(message);
    }

    @KafkaListener(topics = "SCRAPED-vehicle-details-topic", groupId = "turtrack-group")
    public void consumeVehicles(Map<String, Object> message) {
        System.out.println("Received vehicle message: " + message);
        vehicleProcessingService.processAndForwardVehicle(message);
    }

    @KafkaListener(topics = "SCRAPED-dr-availability-topic", groupId = "turtrack-group")
    public void consumePricing(Map<String, Object> message) {
        System.out.println("Received pricing message: " + message);
        dailyRateProcessingService.processAndForwardDailyRates(message);
    }
}