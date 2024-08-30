package com.example.turtrackmanager.dto;

import com.example.turtrackmanager.model.manager.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDTO {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Job.JobStatus status;
    private Job.JobType jobType;
//    private String kafkaTopicTitle;
    private Double percentCompleted;
    private Integer totalItems;
    private Integer completedItems;

    public static JobDTO toDTO(Job job) {
        return JobDTO.builder()
                .id(job.getId())
                .title(job.getTitle())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .finishedAt(job.getFinishedAt())
                .status(job.getStatus())
                .jobType(job.getJobType())
//                .kafkaTopicTitle(job.getKafkaTopicTitle())
                .percentCompleted(job.getPercentCompleted())
                .totalItems(job.getTotalItems())
                .completedItems(job.getCompletedItems())
                .build();
    }



}