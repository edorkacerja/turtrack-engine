package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "locations", indexes = {
        @Index(name = "idx_location_external_id", columnList = "external_id")
})
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private Long externalId;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 50)
    private String state;

    @Column(name = "country", length = 50)
    private String country;

    @Column(name = "latitude", precision = 10)
    private Double latitude;

    @Column(name = "longitude", precision = 11)
    private Double longitude;

    @Column(name = "time_zone", length = 50)
    private String timeZone;

    @OneToMany(mappedBy = "location", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Vehicle> vehicles = new HashSet<>();

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Location)) return false;
        Location location = (Location) o;
        return Objects.equals(externalId, location.externalId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(externalId);
    }

}
