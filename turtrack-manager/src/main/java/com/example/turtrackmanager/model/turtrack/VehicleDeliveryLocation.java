package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vehicle_delivery_locations")
public class VehicleDeliveryLocation {
    @Id
    @Column(name = "vehicle_delivery_location_id")
    private Long vehicleDeliveryLocationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id")
    private DeliveryLocation deliveryLocation;

    private Boolean enabled;
    private Boolean valet;

    @Embedded
    private Fee fee;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Embedded
    private CheckInMethod checkInMethod;

    @ElementCollection
    @CollectionTable(name = "vehicle_delivery_location_non_valet_check_in_methods",
            joinColumns = @JoinColumn(name = "vehicle_delivery_location_id"))
    private List<CheckInMethod> validNonValetCheckInMethods = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "vehicle_delivery_location_valet_check_in_methods",
            joinColumns = @JoinColumn(name = "vehicle_delivery_location_id"))
    private List<CheckInMethod> validValetCheckInMethods = new ArrayList<>();

    @Embeddable
    @Data
    public static class Fee {
        private Double amount;
        private String currencyCode;
    }

    @Embeddable
    @Data
    public static class CheckInMethod {
        @Column(name = "check_in_method")
        private String checkInMethod;

        @Lob
        @Column(name = "description", columnDefinition = "TEXT")
        private String description;

        @Column(name = "title")
        private String title;
    }
}