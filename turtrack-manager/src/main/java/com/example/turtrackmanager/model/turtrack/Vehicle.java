package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;

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

    @Column(name = "name", columnDefinition = "TEXT")
    private String name;

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

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "scalar", column = @Column(name = "daily_distance_scalar")),
            @AttributeOverride(name = "unit", column = @Column(name = "daily_distance_unit")),
            @AttributeOverride(name = "unlimited", column = @Column(name = "daily_distance_unlimited"))
    })
    private Distance dailyDistance;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "scalar", column = @Column(name = "weekly_distance_scalar")),
            @AttributeOverride(name = "unit", column = @Column(name = "weekly_distance_unit")),
            @AttributeOverride(name = "unlimited", column = @Column(name = "weekly_distance_unlimited"))
    })
    private Distance weeklyDistance;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "scalar", column = @Column(name = "monthly_distance_scalar")),
            @AttributeOverride(name = "unit", column = @Column(name = "monthly_distance_unit")),
            @AttributeOverride(name = "unlimited", column = @Column(name = "monthly_distance_unlimited"))
    })
    private Distance monthlyDistance;

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
    @JoinColumn(name = "location_id")
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private Owner owner;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Image> images;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Rating> ratings;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Extra> extras = new HashSet<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleDeliveryLocation> deliveryLocations = new ArrayList<>();

    @Embeddable
    @Data
    public static class Distance {
        private Integer scalar;
        private String unit;
        private Boolean unlimited;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Distance distance = (Distance) o;
            return Objects.equals(scalar, distance.scalar) &&
                    Objects.equals(unit, distance.unit) &&
                    Objects.equals(unlimited, distance.unlimited);
        }

        @Override
        public int hashCode() {
            return Objects.hash(scalar, unit, unlimited);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Vehicle)) return false;
        Vehicle vehicle = (Vehicle) o;
        return Objects.equals(getId(), vehicle.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }

    @Override
    public String toString() {
        return "Vehicle{" +
                "id=" + id +
                ", make='" + make + '\'' +
                ", model='" + model + '\'' +
                ", year=" + year +
                // ... other fields ...
                '}';
    }
}

