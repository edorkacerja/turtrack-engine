package com.example.turtrackmanager.service.kafka;


import com.example.turtrackmanager.service.DailyRateAndAvailabilityService;
import com.example.turtrackmanager.service.VehicleService;
import com.example.turtrackmanager.service.VehicleSkeletonService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

import static com.example.turtrackmanager.util.Constants.Kafka.*;

@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final VehicleSkeletonService vehicleSkeletonService;
    private final VehicleService vehicleService;
    private final DailyRateAndAvailabilityService dailyRateAndAvailabilityService;

    @KafkaListener(topics = SCRAPED_VEHICLE_SKELETON_TOPIC, groupId = "turtrack-group")
    public void consumeVehicleSkeletons(Map<String, Object> message) {
        System.out.println("Received vehicle skeleton message: " + message);
        vehicleSkeletonService.processAndForwardVehicleSkeleton(message);
    }

    @KafkaListener(topics = SCRAPED_VEHICLE_DETAILS_TOPIC, groupId = "turtrack-group")
    public void consumeVehicles(Map<String, Object> message) {
        System.out.println("Received vehicle message: " + message);
        vehicleService.processAndForwardVehicle(message);
    }

    @KafkaListener(topics = SCRAPED_DR_AVAILABILITY_TOPIC, groupId = "turtrack-group")
    public void consumePricing(Map<String, Object> message) {
        System.out.println("Received pricing message: " + message);
        dailyRateAndAvailabilityService.processAndForwardDailyRates(message);
    }

    @KafkaListener(topics = DLQ_DR_AVAILABILITY_TOPIC, groupId = "turtrack-group")
    public void consumeDLQPricing(Map<String, Object> message) {
        System.out.println("Received DQL pricing message: " + message);
        dailyRateAndAvailabilityService.processAndForwardDailyRates(message);
    }
}