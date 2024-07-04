package com.turtrack.datapersistorservice.repository;

import com.turtrack.datapersistorservice.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
}