package com.example.turtrackmanager.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class CreateSearchJobDTO {

    private Integer startAt = 0;
    private Integer limit = 0;
    private Boolean fromOptimalCells = true;
    private Boolean updateOptimalCells = false;
    private Integer cellSize = 4;
    private Integer recursiveDepth = 10;

//    @NotNull(message = "Start date is required")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

//    @NotNull(message = "End date is required")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private String country = "US";
}
