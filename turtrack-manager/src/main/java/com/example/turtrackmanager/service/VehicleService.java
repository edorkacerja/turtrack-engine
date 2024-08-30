package com.example.turtrackmanager.service;

import com.example.turtrackmanager.model.turtrack.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleService {

    private final KafkaTemplate<String, Vehicle> vehicleDetailsKafkaTemplate;


    public void processAndForwardVehicle(Map<String, Object> message) {
        Vehicle vehicle = extractVehicle(message);
        Vehicle cleanedVehicle = cleanVehicle(vehicle);
        log.info("Cleaned Vehicle: {}", vehicle);
        forwardVehicle(cleanedVehicle);
    }

    private Vehicle extractVehicle(Map<String, Object> message) {
        Vehicle vehicle = new Vehicle();

        if (message.containsKey("vehicle")) {
            Map<String, Object> vehicleData = (Map<String, Object>) message.get("vehicle");

            vehicle.setId((Long) vehicleData.get("id"));
            vehicle.setMake((String) vehicleData.get("make"));
            vehicle.setModel((String) vehicleData.get("model"));
            vehicle.setYear((Integer) vehicleData.get("year"));
            vehicle.setTrim((String) vehicleData.get("trim"));
            vehicle.setType((String) vehicleData.get("type"));

            if (vehicleData.containsKey("registration")) {
                Map<String, Object> registration = (Map<String, Object>) vehicleData.get("registration");
                vehicle.setRegistrationState((String) registration.get("state"));
            }
        }

        if (message.containsKey("location")) {
            Map<String, Object> location = (Map<String, Object>) message.get("location");
            vehicle.setCity((String) location.get("city"));
            vehicle.setState((String) location.get("state"));
        }

        if (message.containsKey("rate")) {
            Map<String, Object> rate = (Map<String, Object>) message.get("rate");
            if (rate.containsKey("averageDailyPrice")) {
                vehicle.setAverageDailyPrice(convertToDouble(rate.get("averageDailyPrice")));
            }
        }

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


    private Vehicle cleanVehicle(Vehicle vehicle) {
        // Here you can implement any additional cleaning or transformation logic
        // For now, we'll just return the extracted vehicle as is
        return vehicle;
    }

    private void forwardVehicle(Vehicle vehicle) {
        vehicleDetailsKafkaTemplate.send("PROCESSED-vehicle-details-topic", vehicle);
    }
}