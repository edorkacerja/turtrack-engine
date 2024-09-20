package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.JobCreationDTO;
import com.example.turtrackmanager.dto.ToBeScrapedVehicleKafkaMessage;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
@RequiredArgsConstructor
public class DailyRateAndAvailabilityJobService {

    private final JdbcTemplate jdbcTemplate;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");
    private final KafkaTemplate<String, ToBeScrapedVehicleKafkaMessage> toBeScrapedAvailabilitKafkaTemplate;
    private final JobService jobService;
    private final JobRepository jobRepository;


    @Transactional
    public Job createAndStartAvailabilityJob(JobCreationDTO jobCreationDTO) {
        Job job = jobService.createJob(jobCreationDTO);
        job = jobRepository.save(job);
        log.info("Created job: {}", job);

        try {
            int totalItems = startAvailabilityJob(job, jobCreationDTO);
            job.setTotalItems(totalItems);
            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }


    private int startAvailabilityJob(Job job, JobCreationDTO jobCreationDTO) {
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
            default:
                throw new UnsupportedOperationException("Unsupported job type: " + job.getJobType());
        }

        return totalItems;
    }


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

                    ToBeScrapedVehicleKafkaMessage message = ToBeScrapedVehicleKafkaMessage.builder().build();
                    message.setVehicleId(String.valueOf(id));
                    message.setCountry(country);
                    message.setStartDate(pricingLastUpdated != null && pricingLastUpdated.isAfter(startDate) ?
                            pricingLastUpdated.format(dateFormatter) :
                            startDate.format(dateFormatter));
                    message.setEndDate(endDate.format(dateFormatter));
                    message.setJobId(finalJobId);

                    toBeScrapedAvailabilitKafkaTemplate.send(TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC, String.valueOf(id), message);

                    processedCount.incrementAndGet();
                    return null;
                },
                numberOfVehicles > 0 ? new Object[]{numberOfVehicles} : new Object[]{}
        );

        return processedCount.get();
    }

}
