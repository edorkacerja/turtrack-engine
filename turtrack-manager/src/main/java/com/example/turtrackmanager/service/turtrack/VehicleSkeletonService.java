package com.example.turtrackmanager.service.turtrack;

import com.example.turtrackmanager.model.turtrack.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleSkeletonService {

    private final KafkaTemplate<String, Vehicle> vehicleSkeletonKafkaTemplate;


    public void processAndForwardVehicleSkeleton(Map<String, Object> message) {
        Vehicle vehicle = extractVehicleSkeleton(message);
        Vehicle processedVehicleSkeleton = processVehicleSkeleton(vehicle);

        log.info("Processed Vehicle Skeleton: {}", processedVehicleSkeleton);
        forwardVehicleSkeleton(processedVehicleSkeleton);
    }

    private Vehicle extractVehicleSkeleton(Map<String, Object> message) {
        Vehicle vehicle = new Vehicle();

        if (message.containsKey("scraped")) {
            Map<String, Object> scraped = (Map<String, Object>) message.get("scraped");

            if (scraped.containsKey("vehicles")) {
                List<Map<String, Object>> vehicles = (List<Map<String, Object>>) scraped.get("vehicles");

                if (!vehicles.isEmpty()) {
                    Map<String, Object> vehicleData = vehicles.get(0);

                    // Extract vehicle properties from the first vehicle in the list
                    vehicle.setMake((String) vehicleData.get("make"));
                    vehicle.setModel((String) vehicleData.get("model"));
                    vehicle.setYear((Integer) vehicleData.get("year"));
//                    vehicle.setVin((String) vehicleData.get("vin"));
                    // Add more properties as needed
                }
            }
        }

        if (message.containsKey("id")) {
            vehicle.setId((Long) message.get("id"));
            vehicle.setCountry((String) message.get("country"));
            vehicle.setCellId((String) message.get("cellId"));
            vehicle.setStatus((String) message.get("status"));
        }

        // Uncomment and use this if you need to extract location information
        // if (message.containsKey("location")) {
        //     Map<String, Object> location = (Map<String, Object>) message.get("location");
        //     vehicle.setCity((String) location.get("city"));
        //     vehicle.setState((String) location.get("state"));
        // }

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