package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "badges", indexes = {
        @Index(name = "idx_badge_external_id", columnList = "external_id")
})
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", unique = true)
    private Long externalId;

    @Column(name = "label")
    private String label;

    @Column(name = "value")
    private String value;

    // Many-to-many relationship with Vehicle
    @ManyToMany(mappedBy = "badges")
    private Set<Vehicle> vehicles;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Badge)) return false;
        Badge badge = (Badge) o;
        return Objects.equals(externalId, badge.externalId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(externalId);
    }

}
