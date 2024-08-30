package com.example.turtrackmanager.controller;

import com.example.turtrackmanager.dto.JobCreationDTO;
import com.example.turtrackmanager.dto.JobDTO;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.service.JobService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.example.turtrackmanager.service.VehicleKafkaService;

import java.time.LocalDate;

import static com.example.turtrackmanager.util.Constants.Kafka.TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC;
import static com.example.turtrackmanager.util.Constants.Kafka.TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC;

@RestController
@RequestMapping("/api/v1/jobs")
@Slf4j
@AllArgsConstructor
public class JobController {

    private final VehicleKafkaService vehicleKafkaService;
    private final JobService jobService;

    @GetMapping
    public ResponseEntity<Page<JobDTO>> getAllJobs(Pageable pageable) {
        log.info("Received request to get all jobs with pagination: {}", pageable);
        Page<Job> jobPage = jobService.getAllJobs(pageable);
        Page<JobDTO> jobDTOPage = jobPage.map(JobDTO::toDTO);
        return ResponseEntity.ok(jobDTOPage);
    }

    @PostMapping("/create")
    public ResponseEntity<JobDTO> startJob(@RequestBody @Validated JobCreationDTO jobCreationDTO) {
        log.info("Received request to start job: {}", jobCreationDTO);
        Job createdJob = jobService.createAndStartJob(jobCreationDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(JobDTO.toDTO(createdJob));
    }

    @GetMapping("/{jobId}/status")
    public ResponseEntity<Job.JobStatus> getJobStatus(@PathVariable Long jobId) {
        log.info("Received request to get status for job id: {}", jobId);
        Job.JobStatus status = null;
        try {
            status = jobService.getJobStatus(jobId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(status);
    }

    @PostMapping("/{jobId}/start")
    public ResponseEntity<JobDTO> startJob(@PathVariable Long jobId) {
        log.info("Received request to start job id: {}", jobId);
        Job startedJob = jobService.startJob(jobId);
        return ResponseEntity.ok(JobDTO.toDTO(startedJob));
    }


    @PostMapping("/{jobId}/stop")
    public ResponseEntity<JobDTO> stopJob(@PathVariable Long jobId) {
        log.info("Received request to stop job id: {}", jobId);
        Job stoppedJob = jobService.stopJob(jobId);
        return ResponseEntity.ok(JobDTO.toDTO(stoppedJob));
    }

    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long jobId) {
        log.info("Received request to delete job id: {}", jobId);
        jobService.deleteJob(jobId);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/startAvailabilityScraperJob")
    public String startAvailabilityScraperJob(
            @RequestParam(defaultValue = "0") int numberOfVehicles,
            @RequestParam(required = false) @DateTimeFormat(pattern = "MM/dd/yyyy") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "MM/dd/yyyy") LocalDate endDate) {
        try {
            if (numberOfVehicles <= 0) {
                if (startDate != null && endDate != null) {
                    vehicleKafkaService.feedVehiclesToAvailabilityScraper(startDate, endDate);
                    return String.format("Successfully started availability scraper job for all vehicles from %s to %s.", startDate, endDate);
                } else {
                    vehicleKafkaService.feedVehiclesToAvailabilityScraper();
                    return "Successfully started availability scraper job for all vehicles in the database.";
                }
            } else {
                int processedCount;
                if (startDate != null && endDate != null) {
                    processedCount = vehicleKafkaService.feedVehiclesToAvailabilityScraper(TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC, numberOfVehicles, startDate, endDate, null);
                    return String.format("Successfully started availability scraper job for %d vehicles from %s to %s.", processedCount, startDate, endDate);
                } else {
                    processedCount = vehicleKafkaService.feedVehiclesToAvailabilityScraper(numberOfVehicles);
                    return String.format("Successfully started availability scraper job for %d vehicles.", processedCount);
                }
            }
        } catch (Exception e) {
            log.error("Error starting availability scraper job", e);
            return "Error starting availability scraper job: " + e.getMessage();
        }
    }

    @PostMapping("/startVehicleDetailsScraperJob")
    public String startVehicleDetailsScraperJob(@RequestParam(defaultValue = "0") int numberOfVehicles) {
        try {
            int processedCount = vehicleKafkaService.feedVehiclesToDetailsScraper(TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC, numberOfVehicles);
            if (numberOfVehicles <= 0) {
                return "Successfully started vehicle details scraper job for all vehicles in the database.";
            } else {
                return String.format("Successfully started vehicle details scraper job for %d vehicles.", processedCount);
            }
        } catch (Exception e) {
            log.error("Error starting vehicle details scraper job", e);
            return "Error starting vehicle details scraper job: " + e.getMessage();
        }
    }

}
