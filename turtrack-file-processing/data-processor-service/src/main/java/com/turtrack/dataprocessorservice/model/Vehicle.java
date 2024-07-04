package com.turtrack.dataprocessorservice.model;

import lombok.Data;

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

    // Getters and setters for all fields
    // ...

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
                '}';
    }
}