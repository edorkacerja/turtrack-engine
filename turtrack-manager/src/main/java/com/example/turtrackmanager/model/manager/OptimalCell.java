package com.example.turtrackmanager.model.manager;

import com.example.turtrackmanager.model.turtrack.Cell;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "optimal_cells")
@Builder
public class OptimalCell {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "country", nullable = false)
    private String country;

    @Column(name = "cell_size", nullable = false)
    private Integer cellSize;

    @Column(name = "status")
    private String status;

    @Column(name = "top_right_lat", nullable = false)
    private Double topRightLat;

    @Column(name = "top_right_lng", nullable = false)
    private Double topRightLng;

    @Column(name = "bottom_left_lat", nullable = false)
    private Double bottomLeftLat;

    @Column(name = "bottom_left_lng", nullable = false)
    private Double bottomLeftLng;

    @Column(name = "search_last_updated")
    private String searchLastUpdated;

}
