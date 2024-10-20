package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vehicle_delivery_locations", indexes = {
        @Index(name = "idx_vdl_external_id", columnList = "external_id")
})
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class VehicleDeliveryLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private Long externalId;

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

    @Column(name = "instructions", length = 5000)
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

        @Column(name = "description", length = 5000)
        private String description;

        @Column(name = "title")
        private String title;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof VehicleDeliveryLocation)) return false;
        VehicleDeliveryLocation vehicleDeliveryLocation = (VehicleDeliveryLocation) o;
        return Objects.equals(externalId, vehicleDeliveryLocation.externalId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(externalId);
    }

}