package com.example.turtrackmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

@Data
public class CreateVehicleDetailsJobDTO {

    private Integer startAt = 0;
    private Integer limit = Integer.MAX_VALUE;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "MM/dd/yyyy")
    private LocalDate startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "MM/dd/yyyy")
    private LocalDate endDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm")
    private LocalTime endTime;

    // Getter for startDate with default value
    public LocalDate getStartDate() {
        return Optional.ofNullable(startDate).orElse(LocalDate.now());
    }

    // Getter for endDate with default value
    public LocalDate getEndDate() {
        return Optional.ofNullable(endDate).orElse(LocalDate.now().plusDays(7));
    }

    // Getter for startTime with default value
    public LocalTime getStartTime() {
        return Optional.ofNullable(startTime).orElse(LocalTime.now());
    }

    // Getter for endTime with default value
    public LocalTime getEndTime() {
        return Optional.ofNullable(endTime).orElse(LocalTime.now());
    }
}