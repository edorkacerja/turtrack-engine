package com.example.turtrackmanager.dto;

import com.example.turtrackmanager.model.manager.Job;
import lombok.Data;

import java.time.LocalDate;

@Data
public class JobCreationDTO {
    private Job.JobType jobType;
    private LocalDate startDate;
    private LocalDate endDate;
    private int numberOfVehicles; // 0 means all vehicles
}