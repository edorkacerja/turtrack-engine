package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.ToBeScrapedVehicleKafkaMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

import static com.example.turtrackmanager.util.Constants.Kafka.TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC;


@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleDetailsJobService {

    private final JdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, ToBeScrapedVehicleKafkaMessage> kafkaTemplate;


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

                    ToBeScrapedVehicleKafkaMessage message = ToBeScrapedVehicleKafkaMessage.builder()
                            .vehicleId(String.valueOf(id))
                            .country(country)
                            .build();

                    kafkaTemplate.send(TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC, String.valueOf(id), message);

                    processedCount.incrementAndGet();
                    return null;
                },
                numberOfVehicles > 0 ? new Object[]{numberOfVehicles} : new Object[]{}
        );

        return processedCount.get();
    }

}
