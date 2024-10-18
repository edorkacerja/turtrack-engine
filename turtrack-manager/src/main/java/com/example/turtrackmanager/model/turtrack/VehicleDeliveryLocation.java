package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "vehicle_delivery_locations")
@JsonIgnoreProperties(ignoreUnknown = true)
public class VehicleDeliveryLocation {


    @EmbeddedId
    private VehicleDeliveryLocationId id;

    @Column(name = "fee", precision = 10)
    private Double fee;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("vehicleId")
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("locationId")
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Embeddable
    public static class VehicleDeliveryLocationId implements Serializable {

        private Long vehicleId;
        private Long locationId;

        // Getters and Setters

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            VehicleDeliveryLocationId that = (VehicleDeliveryLocationId) o;
            return Objects.equals(vehicleId, that.vehicleId) &&
                    Objects.equals(locationId, that.locationId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(vehicleId, locationId);
        }
    }
}

