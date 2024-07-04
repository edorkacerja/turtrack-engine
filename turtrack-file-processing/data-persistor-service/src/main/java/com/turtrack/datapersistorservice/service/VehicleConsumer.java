package com.turtrack.datapersistorservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.turtrack.datapersistorservice.model.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class VehicleConsumer {

    private final VehiclePersistenceService persistenceService;
    private final ObjectMapper jsonObjectMapper;


    @KafkaListener(topics = "cleaned-vehicle-topic", groupId = "vehicle-persistence-group")
    public void consume(List<ConsumerRecord<String, String>> records) {
        log.info("Received batch of {} records", records.size());

        List<Vehicle> vehicles = records.stream()
                .map(record -> deserializeVehicle(record.value()))
                .filter(v -> v != null)
                .collect(Collectors.toList());

        log.info("Deserialized {} valid vehicles", vehicles.size());

        if (!vehicles.isEmpty()) {
            persistenceService.saveOrUpdateVehicles(vehicles);
        }
    }

    private Vehicle deserializeVehicle(String json) {
        try {
            return jsonObjectMapper.readValue(json, Vehicle.class);
        } catch (JsonProcessingException e) {
            log.error("Error deserializing vehicle: {}", json, e);
            return null;
        }
    }
}