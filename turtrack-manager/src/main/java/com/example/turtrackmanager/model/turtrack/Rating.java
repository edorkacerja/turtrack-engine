package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "ratings")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Rating {

    @Id
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "overall_rating", precision = 3)
    private Double overallRating;

    @Column(name = "cleanliness", precision = 3)
    private Double cleanliness;

    @Column(name = "maintenance", precision = 3)
    private Double maintenance;

    @Column(name = "communication", precision = 3)
    private Double communication;

    @Column(name = "convenience", precision = 3)
    private Double convenience;

    @Column(name = "accuracy", precision = 3)
    private Double accuracy;

    @Column(name = "total_ratings")
    private Integer totalRatings;
}
