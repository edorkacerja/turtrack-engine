package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "owners")
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Owner {

    @Id
    private Long id;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "url")
    private String url;

    @Column(name = "is_all_star_host")
    private Boolean isAllStarHost;

    @Column(name = "is_pro_host")
    private Boolean isProHost;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vehicle> vehicles = new ArrayList<>();

    @OneToOne(mappedBy = "owner", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private Image image;

    public void addVehicle(Vehicle vehicle) {
        vehicles.add(vehicle);
        vehicle.setOwner(this);
    }

    public void removeVehicle(Vehicle vehicle) {
        vehicles.remove(vehicle);
        vehicle.setOwner(null);
    }
}