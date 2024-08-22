package com.example.turtrackmanager.service;

import com.example.turtrackmanager.dto.JobCreationDTO;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final VehicleKafkaService vehicleKafkaService;
    private final KafkaAdminService kafkaAdminService;

    @Transactional
    public Job createAndStartJob(JobCreationDTO jobCreationDTO) {
        // Step 1: Create the job with status CREATED and save it to the database
        Job job = createJob(jobCreationDTO);
        job = jobRepository.save(job);
        log.info("Created job: {}", job);

        try {
            // Step 2: Generate the topic name using the saved job ID and the creation date
            String topicName = generateTopicName(job);
            job.setKafkaTopicTitle(topicName);

            // Step 3: Create the Kafka topic
            kafkaAdminService.createTopic(topicName, 10, (short) 1);

            // Step 4: Start the job and set total items (number of vehicles)
            int totalItems = startJob(job, jobCreationDTO);
            job.setTotalItems(totalItems);

            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        // Save the updated job status and other details, including totalItems
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
                .build();
    }

    private int startJob(Job job, JobCreationDTO jobCreationDTO) {
        int totalItems = 0;

        switch (job.getJobType()) {
            case DAILY_RATE_AND_AVAILABILITY:
                totalItems = vehicleKafkaService.feedVehiclesToAvailabilityScraper(
                        job.getKafkaTopicTitle(),
                        jobCreationDTO.getNumberOfVehicles(),
                        jobCreationDTO.getStartDate(),
                        jobCreationDTO.getEndDate()
                );
                break;
            case VEHICLE_DETAILS:
                totalItems = vehicleKafkaService.feedVehiclesToDetailsScraper(
                        job.getKafkaTopicTitle(),
                        jobCreationDTO.getNumberOfVehicles()
                );
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
//            job.setFinishedAt(LocalDateTime.now());
            log.info("Started job: {}", job);
            return jobRepository.save(job);
        } else {
            log.warn("Attempted to stop job {} which is already in RUNNING state", jobId);
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

        // Delete the Kafka topic associated with the job
        try {
            kafkaAdminService.deleteTopic(job.getKafkaTopicTitle());
        } catch (Exception e) {
            log.error("Failed to delete Kafka topic for job: {}", jobId, e);
            // Depending on your requirements, you might want to throw an exception here
            // or continue with the job deletion even if the topic deletion fails
        }

        // Update job status to CANCELLED
        job.setStatus(Job.JobStatus.CANCELLED);
        job.setFinishedAt(LocalDateTime.now());
        jobRepository.save(job);

        log.info("Deleted job and associated Kafka topic: {}", job);
    }

    private String generateJobTitle(JobCreationDTO jobCreationDTO) {
        return String.format("%s Job - %s",
                jobCreationDTO.getJobType(),
                LocalDateTime.now().toString());
    }

    private String generateTopicName(Job job) {
        String formattedDate = job.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM-d"));
        String dayWithSuffix = addDaySuffix(formattedDate);
        String formattedDateWithYear = dayWithSuffix + "-" + job.getCreatedAt().getYear();

        return String.format("%s-%s-job-%d-%s",
                "TO-BE-SCRAPED",
                job.getJobType().toString().toLowerCase(),
                job.getId(),
                formattedDateWithYear);
    }

    private String addDaySuffix(String formattedDate) {
        int day = Integer.parseInt(formattedDate.split("-")[1]);
        String suffix;
        switch (day % 10) {
            case 1: suffix = (day == 11) ? "th" : "st"; break;
            case 2: suffix = (day == 12) ? "th" : "nd"; break;
            case 3: suffix = (day == 13) ? "th" : "rd"; break;
            default: suffix = "th"; break;
        }
        return formattedDate.split("-")[0] + "-" + day + suffix;
    }
}
