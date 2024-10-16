package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.CreateAvailabilityJobDTO;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final EntityManager entityManager;

    public JobService(JobRepository jobRepository,
                      @Qualifier("managerEntityManagerFactory") EntityManager entityManager) {
        this.jobRepository = jobRepository;
        this.entityManager = entityManager;
    }


    public Page<Job> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable);
    }

    public Job.JobStatus getJobStatus(Long jobId) {
        return jobRepository.findById(jobId)
                .map(Job::getStatus)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
    }

    public Job createJob(CreateAvailabilityJobDTO createAvailabilityJobDTO) {
        return Job.builder()
                .title(generateJobTitle(createAvailabilityJobDTO))
                .status(Job.JobStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .jobType(createAvailabilityJobDTO.getJobType())
                .completedItems(0)
                .percentCompleted(0.0)
                .build();
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

    private String generateJobTitle(CreateAvailabilityJobDTO createAvailabilityJobDTO) {
        return String.format("%s Job - %s",
                createAvailabilityJobDTO.getJobType(),
                LocalDateTime.now().toString());
    }

    public Job getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
    }

    @Transactional("managerTransactionManager")
    public void incrementCompletedItems(Long jobId, Integer completedIncrement) {
        Job job = entityManager.find(Job.class, jobId, LockModeType.PESSIMISTIC_WRITE);

        if (job == null) {
            throw new RuntimeException("Job not found with id: " + jobId);
        }

        int newCompletedItems = job.getCompletedItems() + completedIncrement;
        int failedItems = job.getFailedItems();
        job.setCompletedItems(newCompletedItems);
        job.setFailedItems(failedItems);

        int totalProcessedItems = newCompletedItems + failedItems;
        int totalItems = job.getTotalItems();

        // Recalculate percentage completed
        if (totalProcessedItems > 0) {
            double percentCompleted = totalProcessedItems / (double) totalItems * 100;
            job.setPercentCompleted(Math.min(percentCompleted, 100.0));
        }

        // Check if job is completed
        if (totalProcessedItems >= totalItems) {
            job.setStatus(Job.JobStatus.FINISHED);
        }

        // Save the changes
        entityManager.merge(job);

        log.info("Updated job {}: completed = {}, failed = {}, total = {}, status = {}",
                jobId, newCompletedItems, failedItems, totalItems, job.getStatus());
    }

    @Transactional("managerTransactionManager")
    public Job incrementTotalItems(Long jobId, Integer increment) {
        Job job = entityManager.find(Job.class, jobId, LockModeType.PESSIMISTIC_WRITE);

        if (job == null) {
            throw new RuntimeException("Job not found with id: " + jobId);
        }

        int newTotalItems = job.getTotalItems() + increment;
        job.setTotalItems(newTotalItems);

        // Recalculate percentage completed
        if (newTotalItems > 0) {
            double percentCompleted = (double) job.getCompletedItems() / newTotalItems * 100;
            job.setPercentCompleted(Math.min(percentCompleted, 100.0));
        }

        log.info("Incremented total items for job {}: new total = {}", jobId, newTotalItems);
        return job; // No need to call save() as the entity is managed and changes will be persisted
    }
}