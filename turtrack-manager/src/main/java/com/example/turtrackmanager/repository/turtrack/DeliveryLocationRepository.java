package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.DeliveryLocation;
import com.example.turtrackmanager.model.turtrack.VehicleDeliveryLocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryLocationRepository extends JpaRepository<DeliveryLocation, String> {
}
