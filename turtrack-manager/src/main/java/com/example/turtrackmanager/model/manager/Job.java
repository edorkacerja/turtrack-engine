package com.example.turtrackmanager.model.manager;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "job")
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Column(name = "job_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private JobType jobType;

    @Column(name = "kafka_topic_title", nullable = true)
    private String kafkaTopicTitle;

    @Column(name = "percent_completed")
    private Double percentCompleted;

    @Column(name = "total_items")
    private Integer totalItems;

    @Column(name = "completed_items")
    private Integer completedItems;

    public enum JobStatus {
        CREATED, RUNNING, STOPPED, CANCELLED, FINISHED, FAILED
    }

    public enum JobType {
        SEARCH,
        DAILY_RATE_AND_AVAILABILITY,
        VEHICLE_DETAILS
    }
}