package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.CreateVehicleDetailsJobDTO;
import com.example.turtrackmanager.dto.ToBeScrapedVehicleDetailsMessage;
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
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static com.example.turtrackmanager.util.Constants.RabbitMQ.TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE;

@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleDetailsJobService {

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
    private final JobService jobService;
    private final JobRepository jobRepository;
    private final VehicleService vehicleService;
    private final RabbitMQProducer rabbitMQProducer;

    @Transactional
    public Job createAndStartVehicleDetailsJob(CreateVehicleDetailsJobDTO createVehicleDetailsJobDTO) {
        Job job = Job.builder()
                .title("Vehicle Details Job")
                .status(Job.JobStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .jobType(Job.JobType.VEHICLE_DETAILS)
                .completedItems(0)
                .percentCompleted(0.0)
                .build();

        job = jobRepository.save(job);
        log.info("Created job: {}", job);

        try {
            int totalItems = startVehicleDetailsJob(job, createVehicleDetailsJobDTO);
            job.setTotalItems(totalItems);
            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }

    private int startVehicleDetailsJob(Job job, CreateVehicleDetailsJobDTO createVehicleDetailsJobDTO) {
        if (job.getJobType() != Job.JobType.VEHICLE_DETAILS) {
            throw new UnsupportedOperationException("Unsupported job type: " + job.getJobType());
        }

        return feedVehiclesToDetailsScraper(
                createVehicleDetailsJobDTO.getStartAt(),
                createVehicleDetailsJobDTO.getLimit(),
                createVehicleDetailsJobDTO.getStartDate(),
                createVehicleDetailsJobDTO.getEndDate(),
                createVehicleDetailsJobDTO.getStartTime(),
                createVehicleDetailsJobDTO.getEndTime(),
                String.valueOf(job.getId())
        );
    }

    private int feedVehiclesToDetailsScraper(int startAt, int limit, LocalDate startDate, LocalDate endDate,
                                             LocalTime startTime, LocalTime endTime, String jobId) {
        List<Vehicle> vehicles = vehicleService.getVehiclesWithLimitAndOffset(limit, startAt);

        AtomicInteger processedCount = new AtomicInteger(0);

        vehicles.forEach(vehicle -> {
            try {
                ToBeScrapedVehicleDetailsMessage message = ToBeScrapedVehicleDetailsMessage.builder()
                        .vehicleId(String.valueOf(vehicle.getId()))
                        .startDate(startDate)
                        .endDate(endDate)
                        .startTime(startTime)
                        .endTime(endTime)
                        .jobId(jobId)
                        .build();

                rabbitMQProducer.sendToBeScrapedVehicleDetails(message);
                log.debug("Successfully sent message to Kafka topic '{}': {}", TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE, message);

                processedCount.incrementAndGet();
            } catch (Exception e) {
                log.error("Error processing vehicle {}: {}", vehicle.getId(), e.getMessage());
            }
        });

        return processedCount.get();
    }
}