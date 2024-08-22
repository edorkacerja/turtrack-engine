package com.example.turtrackmanager.service;

import com.example.turtrackmanager.dto.VehicleKafkaMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleKafkaService {

    private final JdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, VehicleKafkaMessage> kafkaTemplate;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    public int feedVehiclesToAvailabilityScraper(int numberOfVehicles) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);

        return feedVehiclesToAvailabilityScraper("TO-BE-SCRAPED-dr-availability-topic", numberOfVehicles, sevenDaysAgo, yesterday);
    }

    public void feedVehiclesToAvailabilityScraper() {
        feedVehiclesToAvailabilityScraper(0); // 0 means process all vehicles
    }

    public void feedVehiclesToAvailabilityScraper(LocalDate startDate, LocalDate endDate) {
        feedVehiclesToAvailabilityScraper("TO-BE-SCRAPED-dr-availability-topic", 0, startDate, endDate);
    }

    public int feedVehiclesToAvailabilityScraper(String topicName, int numberOfVehicles, LocalDate startDate, LocalDate endDate) {
        String sql = "SELECT id, country, pricing_last_updated FROM vehicle";
        if (numberOfVehicles > 0) {
            sql += " LIMIT ?";
        }

        AtomicInteger processedCount = new AtomicInteger(0);

        jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    Long id = rs.getLong("id");
                    String country = rs.getString("country");
                    LocalDate pricingLastUpdated = rs.getObject("pricing_last_updated", LocalDate.class);

                    VehicleKafkaMessage message = new VehicleKafkaMessage();
                    message.setVehicleId(String.valueOf(id));
                    message.setCountry(country);
                    message.setStartDate(pricingLastUpdated != null && pricingLastUpdated.isAfter(startDate) ?
                            pricingLastUpdated.format(dateFormatter) :
                            startDate.format(dateFormatter));
                    message.setEndDate(endDate.format(dateFormatter));

                    kafkaTemplate.send(topicName, String.valueOf(id), message);

                    processedCount.incrementAndGet();
                    return null;
                },
                numberOfVehicles > 0 ? new Object[]{numberOfVehicles} : new Object[]{}
        );

        return processedCount.get();
    }


    public int feedVehiclesToDetailsScraper(String topicName, int numberOfVehicles) {
        String sql = "SELECT id, country FROM vehicle";
        if (numberOfVehicles > 0) {
            sql += " LIMIT ?";
        }

        AtomicInteger processedCount = new AtomicInteger(0);

        jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    Long id = rs.getLong("id");
                    String country = rs.getString("country");

                    VehicleKafkaMessage message = new VehicleKafkaMessage();
                    message.setVehicleId(String.valueOf(id));
                    message.setCountry(country);

                    kafkaTemplate.send("TO-BE-SCRAPED-vehicle-details-topic", String.valueOf(id), message);

                    processedCount.incrementAndGet();
                    return null;
                },
                numberOfVehicles > 0 ? new Object[]{numberOfVehicles} : new Object[]{}
        );

        return processedCount.get();
    }

}