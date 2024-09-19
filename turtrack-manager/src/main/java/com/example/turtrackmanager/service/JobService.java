package com.example.turtrackmanager.service;

import com.example.turtrackmanager.dto.JobCreationDTO;
import com.example.turtrackmanager.dto.VehicleKafkaMessage;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

import static com.example.turtrackmanager.util.Constants.Kafka.TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC;
import static com.example.turtrackmanager.util.Constants.Kafka.TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final JdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, VehicleKafkaMessage> kafkaTemplate;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    public Page<Job> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable);
    }

    @Transactional
    public Job createAndStartJob(JobCreationDTO jobCreationDTO) {
        Job job = createJob(jobCreationDTO);
        job = jobRepository.save(job);
        log.info("Created job: {}", job);

        try {
            int totalItems = startJob(job, jobCreationDTO);
            job.setTotalItems(totalItems);
            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }

    public Job.JobStatus getJobStatus(Long jobId) {
        return jobRepository.findById(jobId)
                .map(Job::getStatus)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
    }

    private Job createJob(JobCreationDTO jobCreationDTO) {
        return Job.builder()
                .title(generateJobTitle(jobCreationDTO))
                .status(Job.JobStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .jobType(jobCreationDTO.getJobType())
                .completedItems(0)
                .percentCompleted(0.0)
                .build();
    }

    private int startJob(Job job, JobCreationDTO jobCreationDTO) {
        int totalItems = 0;

        switch (job.getJobType()) {
            case DAILY_RATE_AND_AVAILABILITY:
                totalItems = feedVehiclesToAvailabilityScraper(
                        jobCreationDTO.getNumberOfVehicles(),
                        jobCreationDTO.getStartDate(),
                        jobCreationDTO.getEndDate(),
                        String.valueOf(job.getId())
                );
                break;
            case VEHICLE_DETAILS:
                totalItems = feedVehiclesToDetailsScraper(TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC, jobCreationDTO.getNumberOfVehicles());
                break;
            case SEARCH:
                // Implement search job logic and set totalItems
                break;
            default:
                throw new UnsupportedOperationException("Unsupported job type: " + job.getJobType());
        }

        return totalItems;
    }

    @Transactional
    public Job startJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        if (job.getStatus() == Job.JobStatus.STOPPED) {
            job.setStatus(Job.JobStatus.RUNNING);
            log.info("Started job: {}", job);
            return jobRepository.save(job);
        } else {
            log.warn("Attempted to start job {} which is already in RUNNING state", jobId);
            return job;
        }
    }

    @Transactional
    public Job stopJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        if (job.getStatus() == Job.JobStatus.RUNNING) {
            job.setStatus(Job.JobStatus.STOPPED);
            job.setFinishedAt(LocalDateTime.now());
            log.info("Stopped job: {}", job);
            return jobRepository.save(job);
        } else {
            log.warn("Attempted to stop job {} which is not in RUNNING state", jobId);
            return job;
        }
    }

    @Transactional
    public void deleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        job.setStatus(Job.JobStatus.CANCELLED);
        job.setFinishedAt(LocalDateTime.now());
        jobRepository.save(job);

        log.info("Deleted job: {}", job);
    }

    private String generateJobTitle(JobCreationDTO jobCreationDTO) {
        return String.format("%s Job - %s",
                jobCreationDTO.getJobType(),
                LocalDateTime.now().toString());
    }

    // Methods from VehicleKafkaService
    public int feedVehiclesToAvailabilityScraper(int numberOfVehicles) {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);

        return feedVehiclesToAvailabilityScraper( numberOfVehicles, sevenDaysAgo, yesterday, null);
    }

    public void feedVehiclesToAvailabilityScraper() {
        feedVehiclesToAvailabilityScraper(0); // 0 means process all vehicles
    }

    public void feedVehiclesToAvailabilityScraper(LocalDate startDate, LocalDate endDate) {
        feedVehiclesToAvailabilityScraper(0, startDate, endDate, null);
    }

    public int feedVehiclesToAvailabilityScraper(int numberOfVehicles, LocalDate startDate, LocalDate endDate, String jobId) {
        if(jobId == null) {
            jobId = "DONT WORRY BE HAPPY";
        }
        String finalJobId = jobId;

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

                    VehicleKafkaMessage message = VehicleKafkaMessage.builder().build();
                    message.setVehicleId(String.valueOf(id));
                    message.setCountry(country);
                    message.setStartDate(pricingLastUpdated != null && pricingLastUpdated.isAfter(startDate) ?
                            pricingLastUpdated.format(dateFormatter) :
                            startDate.format(dateFormatter));
                    message.setEndDate(endDate.format(dateFormatter));
                    message.setJobId(finalJobId);

                    kafkaTemplate.send(TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC, String.valueOf(id), message);

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

                    VehicleKafkaMessage message = VehicleKafkaMessage.builder()
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