package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.JobCreationDTO;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;

    public Page<Job> getAllJobs(Pageable pageable) {
        return jobRepository.findAll(pageable);
    }

    public Job.JobStatus getJobStatus(Long jobId) {
        return jobRepository.findById(jobId)
                .map(Job::getStatus)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));
    }

    public Job createJob(JobCreationDTO jobCreationDTO) {
        return Job.builder()
                .title(generateJobTitle(jobCreationDTO))
                .status(Job.JobStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .jobType(jobCreationDTO.getJobType())
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

    private String generateJobTitle(JobCreationDTO jobCreationDTO) {
        return String.format("%s Job - %s",
                jobCreationDTO.getJobType(),
                LocalDateTime.now().toString());
    }

}