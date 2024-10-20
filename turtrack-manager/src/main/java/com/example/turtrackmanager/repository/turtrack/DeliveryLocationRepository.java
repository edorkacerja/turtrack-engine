package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.DeliveryLocation;
import com.example.turtrackmanager.model.turtrack.VehicleDeliveryLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliveryLocationRepository extends JpaRepository<DeliveryLocation, String> {
    Optional<DeliveryLocation> findByExternalId(String externalId);
}
