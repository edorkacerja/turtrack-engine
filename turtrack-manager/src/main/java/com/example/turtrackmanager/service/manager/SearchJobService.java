package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class SearchJobService {
    private final JobRepository jobRepository;


    @Transactional
    public Job createAndStartSearchJob(Job job, Map<String, Object> searchParams) {
        job = jobRepository.save(job);
        log.info("Created search job: {}", job);

        try {
            // Process and store search parameters
            job.setTotalItems((int)searchParams.get("startAt") - (int) searchParams.get("limit"));
            job.setStatus(Job.JobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Failed to start search job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }

}
