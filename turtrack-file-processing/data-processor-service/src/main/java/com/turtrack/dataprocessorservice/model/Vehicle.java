package com.turtrack.dataprocessorservice.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Vehicle {
    private Integer id;
    private String make;
    private String model;
    private int year;
    private String trim;
    private String type;
    private String registrationState;
    private String city;
    private String state;
    private Double averageDailyPrice;

    // Additional fields
    private String country;
    private String cellId;
    private LocalDateTime pricingLastUpdated;
    private LocalDateTime searchLastUpdated;
    private LocalDateTime detailLastUpdated;
    private String status;

    @Override
    public String toString() {
        return "Vehicle{" +
                "id='" + id + '\'' +
                ", make='" + make + '\'' +
                ", model='" + model + '\'' +
                ", year=" + year +
                ", trim='" + trim + '\'' +
                ", type='" + type + '\'' +
                ", registrationState='" + registrationState + '\'' +
                ", city='" + city + '\'' +
                ", state='" + state + '\'' +
                ", averageDailyPrice=" + averageDailyPrice +
                ", country='" + country + '\'' +
                ", cellId='" + cellId + '\'' +
                ", pricingLastUpdated=" + pricingLastUpdated +
                ", searchLastUpdated=" + searchLastUpdated +
                ", detailLastUpdated=" + detailLastUpdated +
                ", status='" + status + '\'' +
                '}';
    }
}