package com.turtrack.datapersistorservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.turtrack.datapersistorservice.model.DailyRateAndAvailability;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyRateAndAvailabilityConsumer {

    private final DailyRateAndAvailabilityPersistenceService persistenceService;
    private final ObjectMapper jsonObjectMapper;

    @KafkaListener(topics = "processed-dr-availability-topic", groupId = "daily-rate-persistence-group")
    public void consume(List<ConsumerRecord<String, String>> records) {
        log.info("Received batch of {} daily rate records", records.size());

        List<DailyRateAndAvailability> dailyRates = records.stream()
                .map(record -> deserializeDailyRate(record.value()))
                .filter(dr -> dr != null)
                .collect(Collectors.toList());

        log.info("Deserialized {} valid daily rates", dailyRates.size());

        if (!dailyRates.isEmpty()) {
            persistenceService.saveOrUpdateDailyRates(dailyRates);
        }
    }

    private DailyRateAndAvailability deserializeDailyRate(String json) {
        try {
            JsonNode node = jsonObjectMapper.readTree(json);
            DailyRateAndAvailability dailyRate = new DailyRateAndAvailability();

            // Create and set the composite ID
            DailyRateAndAvailability.DailyRateAndAvailabilityId id = new DailyRateAndAvailability.DailyRateAndAvailabilityId();
            id.setVehicleId(node.get("vehicleId").asLong());
            JsonNode dateNode = node.get("date");
            id.setDate(LocalDate.of(dateNode.get(0).asInt(), dateNode.get(1).asInt(), dateNode.get(2).asInt()));
            dailyRate.setId(id);

            // Set other fields
            dailyRate.setCustomSetPrice(node.get("custom").asBoolean());
            dailyRate.setLocalizedDayOfWeek(node.get("localizedDayOfWeek").asText());
            dailyRate.setPrice(node.get("price").asDouble());
            dailyRate.setCurrencyCode(node.get("currencyCode").asText());
            dailyRate.setWholeDayUnavailable(node.get("wholeDayUnavailable").asBoolean());

            return dailyRate;
        } catch (JsonProcessingException e) {
            log.error("Error deserializing daily rate: {}", json, e);
            return null;
        }
    }
}