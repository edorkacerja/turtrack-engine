package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "delivery_locations", indexes = {
        @Index(name = "idx_dl_external_id", columnList = "external_id")
})
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeliveryLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private String externalId;

    @Column(name = "formatted_address")
    private String formattedAddress;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "name")
    private String name;

    @Column(name = "operational")
    private Boolean operational;

    @Column(name = "type")
    private String type;

    @Column(name = "valet_available")
    private Boolean valetAvailable;

    // You might want to add these fields if they're not handled elsewhere
    private String banner;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeliveryLocation)) return false;
        DeliveryLocation deliveryLocation = (DeliveryLocation) o;
        return Objects.equals(externalId, deliveryLocation.externalId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(externalId);
    }


}