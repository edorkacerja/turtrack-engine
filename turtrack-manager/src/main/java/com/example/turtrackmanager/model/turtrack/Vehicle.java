package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@Table(name = "vehicles")
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Vehicle {

    @Id
    private Long id;

    @Column(name = "make")
    private String make;

    @Column(name = "model")
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "trim")
    private String trim;

    @Column(name = "type")
    private String type;

    @Column(name = "color")
    private String color;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "registration_state")
    private String registrationState;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "average_daily_price")
    private Double averageDailyPrice;

    @Column(name = "cell_id")
    private String cellId;

    @Column(name = "status")
    private String status;

    @Column(name = "automatic_transmission")
    private Boolean automaticTransmission;

    @Column(name = "number_of_doors")
    private Integer numberOfDoors;

    @Column(name = "number_of_seats")
    private Integer numberOfSeats;

    @Column(name = "fuel_type")
    private String fuelType;

    @Column(name = "listing_created_time")
    private LocalDateTime listingCreatedTime;

    @Column(name = "daily_distance")
    private Integer dailyDistance;

    @Column(name = "weekly_distance")
    private Integer weeklyDistance;

    @Column(name = "monthly_distance")
    private Integer monthlyDistance;

    @Column(name = "weekly_discount_percentage")
    private Integer weeklyDiscountPercentage;

    @Column(name = "monthly_discount_percentage")
    private Integer monthlyDiscountPercentage;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "number_of_trips")
    private Integer numberOfTrips;

    @Column(name = "number_of_reviews")
    private Integer numberOfReviews;

    @Column(name = "pricing_last_updated")
    private LocalDateTime pricingLastUpdated;

    @Column(name = "search_last_updated")
    private LocalDateTime searchLastUpdated;

    @Column(name = "detail_last_updated")
    private LocalDateTime detailLastUpdated;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private Owner owner;
}