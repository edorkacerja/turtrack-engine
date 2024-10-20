package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "delivery_locations")
public class DeliveryLocation {
    @Id
    @Column(name = "place_id")
    private String placeId;

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

}