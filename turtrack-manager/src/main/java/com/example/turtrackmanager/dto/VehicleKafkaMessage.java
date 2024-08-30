package com.example.turtrackmanager.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class VehicleKafkaMessage {
    private String vehicleId;
    private String country;
    private String startDate;
    private String endDate;
    private String jobId;
}
