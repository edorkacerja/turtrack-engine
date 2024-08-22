package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vehicle")
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

    @Column(name = "registration_state")
    private String registrationState;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "average_daily_price")
    private Double averageDailyPrice;

    @Column(name = "country")
    private String country;

    @Column(name = "cell_id")
    private String cellId;

    @Column(name = "pricing_last_updated")
    private LocalDateTime pricingLastUpdated;

    @Column(name = "search_last_updated")
    private LocalDateTime searchLastUpdated;

    @Column(name = "detail_last_updated")
    private LocalDateTime detailLastUpdated;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private Host host;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Trip> trips = new ArrayList<>();

    //    @OneToMany(mappedBy = "vehicle")
    //    private List<DailyRateAndAvailability> dailyRateAndAvailabilityList;

    public void addTrip(Trip trip) {
        trips.add(trip);
        trip.setVehicle(this);
    }

    public void removeTrip(Trip trip) {
        trips.remove(trip);
        trip.setVehicle(null);
    }
}
