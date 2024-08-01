package com.turtrack.dataprocessorservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turtrack.dataprocessorservice.model.DailyRateAndAvailability;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class DailyRateProcessingService {

    private final KafkaTemplate<String, DailyRateAndAvailability> dailyRateAndAvailabilityKafkaTemplate;

    public void processAndForwardDailyRates(Map<String, Object> message) {
        Long vehicleId = extractVehicleId(message);
        List<DailyRateAndAvailability> dailyRates = extractDailyRates(message, vehicleId);
        for (DailyRateAndAvailability dailyRate : dailyRates) {
            forwardDailyRate(dailyRate);
        }
    }

    private List<DailyRateAndAvailability> extractDailyRates(Map<String, Object> message, Long vehicleId) {
        List<DailyRateAndAvailability> dailyRates = new ArrayList<>();
        List<Map<String, Object>> dailyPricingResponses = (List<Map<String, Object>>) message.get("dailyPricingResponses");

        for (Map<String, Object> dailyPricing : dailyPricingResponses) {
            DailyRateAndAvailability dailyRate = new DailyRateAndAvailability();
            dailyRate.setVehicleId(vehicleId);
            dailyRate.setDate(LocalDate.parse((String) dailyPricing.get("date")));
            dailyRate.setCustom((Boolean) dailyPricing.get("custom"));
            dailyRate.setLocalizedDayOfWeek((String) dailyPricing.get("localizedDayOfWeek"));
            dailyRate.setLocalizedShortDayOfWeek((String) dailyPricing.get("localizedShortDayOfWeek"));
            dailyRate.setPrice(convertToDouble(dailyPricing.get("price")));
            dailyRate.setPriceEditable((Boolean) dailyPricing.get("priceEditable"));
            Map<String, Object> priceWithCurrency = (Map<String, Object>) dailyPricing.get("priceWithCurrency");
            dailyRate.setCurrencyCode((String) priceWithCurrency.get("currencyCode"));
            dailyRate.setSource((String) dailyPricing.get("source"));
            dailyRate.setWholeDayUnavailable((Boolean) dailyPricing.get("wholeDayUnavailable"));

            dailyRates.add(dailyRate);
        }

        return dailyRates;
    }


    private Long extractVehicleId(Map<String, Object> message) {
        // Adjust this based on your actual message structure
        Object vehicleIdObj = message.get("vehicleId");
        if (vehicleIdObj instanceof Integer) {
            return ((Integer) vehicleIdObj).longValue();
        } else if (vehicleIdObj instanceof Long) {
            return (Long) vehicleIdObj;
        } else if (vehicleIdObj instanceof String) {
            return Long.parseLong((String) vehicleIdObj);
        }
        throw new IllegalArgumentException("Vehicle ID not found or has an unexpected type");
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

    private void forwardDailyRate(DailyRateAndAvailability dailyRate) {
        dailyRateAndAvailabilityKafkaTemplate.send("PROCESSED-dr-availability-topic", dailyRate);
    }
}