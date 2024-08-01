package com.turtrack.dataprocessorservice.service;

import com.turtrack.dataprocessorservice.model.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;


@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleSkeletonProcessingService {

    private final KafkaTemplate<String, Vehicle> vehicleSkeletonKafkaTemplate;


    public void processAndForwardVehicleSkeleton(Map<String, Object> message) {
        Vehicle vehicle = extractVehicleSkeleton(message);
        Vehicle processedVehicleSkeleton = processVehicleSkeleton(vehicle);

        log.info("Processed Vehicle Skeleton: {}", processedVehicleSkeleton);
        forwardVehicleSkeleton(processedVehicleSkeleton);
    }

    private Vehicle extractVehicleSkeleton(Map<String, Object> message) {
        Vehicle vehicle = new Vehicle();

        if (message.containsKey("id")) {

            vehicle.setId((Integer) message.get("id"));
            vehicle.setCountry((String) message.get("country"));
            vehicle.setCellId((String) message.get("cellId"));
            vehicle.setStatus((String) message.get("status"));

        }

//        if (message.containsKey("location")) {
//            Map<String, Object> location = (Map<String, Object>) message.get("location");
//            vehicle.setCity((String) location.get("city"));
//            vehicle.setState((String) location.get("state"));
//        }

        return vehicle;
    }

    private Integer convertToInteger(Object value) {
        if (value instanceof Integer) {
            return (Integer) value;
        } else if (value instanceof Double) {
            return ((Double) value).intValue();
        } else if (value instanceof String) {
            return Integer.parseInt((String) value);
        }
        throw new IllegalArgumentException("Cannot convert " + value + " to Integer");
    }

    private Double convertToDouble(Object value) {
        if (value instanceof Integer) {
            return ((Integer) value).doubleValue();
        } else if (value instanceof Double) {
            return (Double) value;
        } else if (value instanceof String) {
            return Double.parseDouble((String) value);
        }
        throw new IllegalArgumentException("Cannot convert " + value + " to Double");
    }


    private Vehicle processVehicleSkeleton(Vehicle vehicle) {

        // Add Search last updated to vehicle
        vehicle.setSearchLastUpdated(LocalDateTime.now());

        return vehicle;
    }

    private void forwardVehicleSkeleton(Vehicle vehicle) {
        vehicleSkeletonKafkaTemplate.send("PROCESSED-vehicle-skeleton-topic", vehicle);
    }
}