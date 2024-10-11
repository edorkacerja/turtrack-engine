package com.example.turtrackmanager.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ToBeScrapedCellKafkaMessage {
    private String id;
    private String country;
    private Integer cellSize;
    private String status;
    private Double topRightLat;
    private Double topRightLng;
    private Double bottomLeftLng;
    private Double bottomLeftLat;
    private String startDate;
    private String endDate;
    private String jobId;
    private Boolean updateOptimalCell;
}
