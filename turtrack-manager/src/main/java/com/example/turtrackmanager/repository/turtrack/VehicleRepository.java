package com.example.turtrackmanager.repository.turtrack;


import com.example.turtrackmanager.model.turtrack.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
}
