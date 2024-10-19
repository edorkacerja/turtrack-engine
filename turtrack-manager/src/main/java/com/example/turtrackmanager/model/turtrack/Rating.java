package com.example.turtrackmanager.model.turtrack;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "ratings")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "owner_overall", precision = 3)
    private Double ownerOverall;

    @Column(name = "rating_to_hundredth", precision = 4)
    private Double ratingToHundredth;

    @Column(name = "ratings_count")
    private Integer ratingsCount;

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

    // You might want to consider using a more structured approach for storing the histogram data
    // For simplicity, we'll use a JSON column here, but you could also create a separate entity for this
//    @Column(name = "histogram", columnDefinition = "json")
//    private String histogram;
}