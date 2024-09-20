package com.example.turtrackmanager.kafka.producer;

import com.example.turtrackmanager.model.turtrack.Cell;
import com.example.turtrackmanager.model.turtrack.DailyRateAndAvailability;
import com.example.turtrackmanager.model.turtrack.Vehicle;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.example.turtrackmanager.util.Constants.Kafka.*;


// We really might not need this class. but leaving here for now.


@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducer {

    private final KafkaTemplate<String, DailyRateAndAvailability> dailyRateAndAvailabilityKafkaTemplate;
    private final KafkaTemplate<String, Vehicle> vehicleDetailsKafkaTemplate;
    private final KafkaTemplate<String, Cell> searchKafkaTemplate;

    public void sendVehiclesForAvailabilityScraping(List<DailyRateAndAvailability> dailyRateAndAvailabilityDTOS) {
        dailyRateAndAvailabilityDTOS.forEach(dailyRateAndAvailability ->
                dailyRateAndAvailabilityKafkaTemplate.send(TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC, String.valueOf(dailyRateAndAvailability.getId().getVehicleId()), dailyRateAndAvailability)
        );
        log.info("Sent {} vehicles for availability scraping", dailyRateAndAvailabilityDTOS.size());
    }

    public void sendVehiclesForDetailsScraping(List<Vehicle> vehicles) {
        vehicles.forEach(vehicle ->
                vehicleDetailsKafkaTemplate.send(TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC, String.valueOf(vehicle.getId()), vehicle)
        );
        log.info("Sent {} vehicles for details scraping", vehicles.size());
    }

    public void sendCellsForScraping(List<Cell> cells) {
        cells.forEach(cell ->
                searchKafkaTemplate.send(TO_BE_SCRAPED_CELLS_TOPIC, String.valueOf(cell.getId()), cell)
        );
        log.info("Sent {} cells for scraping", cells.size());
    }
}
