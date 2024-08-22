package com.example.turtrackmanager.model.turtrack;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "trip")
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "destination")
    private String destination;

    @Column(name = "cost")
    private Double cost; // Added field for cost

    @Column(name = "description")
    private String description; // Added field for a brief description of the trip

    @Column(name = "is_active")
    private Boolean isActive; // Added field to track if the trip is currently active

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
}
