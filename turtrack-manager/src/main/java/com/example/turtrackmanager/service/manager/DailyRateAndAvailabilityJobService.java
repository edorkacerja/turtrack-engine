package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.CreateAvailabilityJobDTO;
import com.example.turtrackmanager.dto.ToBeScrapedVehicleAvailabilityMessage;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.model.turtrack.Vehicle;
import com.example.turtrackmanager.rabbitmq.producer.RabbitMQProducer;
import com.example.turtrackmanager.repository.manager.JobRepository;
import com.example.turtrackmanager.service.turtrack.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static com.example.turtrackmanager.util.Constants.RabbitMQ.TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE;

@Service
@Slf4j
@RequiredArgsConstructor
public class DailyRateAndAvailabilityJobService {

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
    private final RabbitMQProducer rabbitMQProducer;
    private final JobService jobService;
    private final JobRepository jobRepository;
    private final VehicleService vehicleService;

    @Transactional
    public Job createAndStartAvailabilityJob(CreateAvailabilityJobDTO createAvailabilityJobDTO) {
        Job job = jobService.createJob(createAvailabilityJobDTO);
        job = jobRepository.save(job);
        log.info("Created job: {}", job);

        try {
            int totalItems = startAvailabilityJob(job, createAvailabilityJobDTO);
            job.setTotalItems(totalItems);
            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }

    private int startAvailabilityJob(Job job, CreateAvailabilityJobDTO createAvailabilityJobDTO) {
        int totalItems;

        if (job.getJobType() == Job.JobType.DAILY_RATE_AND_AVAILABILITY) {
            totalItems = feedVehiclesToAvailabilityScraper(
                    createAvailabilityJobDTO.getNumberOfVehicles(),
                    createAvailabilityJobDTO.getStartDate(),
                    createAvailabilityJobDTO.getEndDate(),
                    String.valueOf(job.getId())
            );
        } else {
            throw new UnsupportedOperationException("Unsupported job type: " + job.getJobType());
        }

        return totalItems;
    }

    public int feedVehiclesToAvailabilityScraper(int numberOfVehicles, LocalDate startDate, LocalDate endDate, String jobId) {
        if (jobId == null) {
            jobId = "DONT WORRY BE HAPPY";
        }
        String finalJobId = jobId;

        List<Vehicle> vehicles = (numberOfVehicles > 0)
                ? vehicleService.getVehiclesWithLimit(numberOfVehicles)
                : vehicleService.getAllVehicles();

        AtomicInteger processedCount = new AtomicInteger(0);

        vehicles.forEach(vehicle -> {
            try {
                ToBeScrapedVehicleAvailabilityMessage message = ToBeScrapedVehicleAvailabilityMessage.builder()
                        .vehicleId(String.valueOf(vehicle.getId()))
                        .country(vehicle.getCountry())
                        .startDate(getStartDate(vehicle, startDate))
                        .endDate(endDate.format(dateFormatter))
                        .jobId(finalJobId)
                        .build();

                rabbitMQProducer.sendToBeScrapedDrAvailability(message);
                log.debug("Successfully sent message to RabbitMQ queue '{}': {}", TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE, message);

                processedCount.incrementAndGet();
            } catch (Exception e) {
                log.error("Error processing vehicle {}: {}", vehicle.getId(), e.getMessage());
            }
        });

        return processedCount.get();
    }

    private String getStartDate(Vehicle vehicle, LocalDate defaultStartDate) {
        LocalDateTime pricingLastUpdated = vehicle.getPricingLastUpdated();
        if (pricingLastUpdated != null && pricingLastUpdated.toLocalDate().isAfter(defaultStartDate)) {
            return pricingLastUpdated.format(dateFormatter);
        }
        return defaultStartDate.format(dateFormatter);
    }
}