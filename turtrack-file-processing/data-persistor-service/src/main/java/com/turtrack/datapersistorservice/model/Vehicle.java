package com.turtrack.datapersistorservice.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
public class Vehicle {

    @Id
    @JsonProperty("id")
    private Integer id;

    @JsonProperty("make")
    private String make;

    @JsonProperty("model")
    private String model;

    @JsonProperty("year")
    private Integer year;

    @JsonProperty("trim")
    private String trim;

    @JsonProperty("type")
    private String type;

    @JsonProperty("registrationState")
    private String registrationState;

    @JsonProperty("city")
    private String city;

    @JsonProperty("state")
    private String state;

    @JsonProperty("averageDailyPrice")
    private Double averageDailyPrice;
}