package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "badges")
public class Badge {

    @Id
    private Long id;

    @Column(name = "label")
    private String label;

    @Column(name = "value")
    private String value;

    // Many-to-many relationship with Vehicle
    @ManyToMany(mappedBy = "badges")
    private Set<Vehicle> vehicles;

    // Equals and hashCode based on id
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Badge badge = (Badge) o;

        return id != null ? id.equals(badge.id) : badge.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
}
