package com.turtrack.datapersistorservice.service;

import com.turtrack.datapersistorservice.model.Vehicle;
import com.turtrack.datapersistorservice.repository.VehicleRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehiclePersistenceService {

    private final VehicleRepository vehicleRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void saveOrUpdateVehicles(List<Vehicle> vehicles) {
        try {
            log.info("Processing batch of {} vehicles", vehicles.size());
            for (int i = 0; i < vehicles.size(); i++) {
                Vehicle vehicle = vehicles.get(i);
                saveOrUpdateVehicle(vehicle);
                log.info("Processed vehicle {}: ID={}, Make={}, Model={}", i, vehicle.getId(), vehicle.getMake(), vehicle.getModel());
                if (i % 50 == 0 && i > 0) {
                    entityManager.flush();
                    entityManager.clear();
                    log.info("Flushed and cleared after {} vehicles", i);
                }
            }
            entityManager.flush();
            entityManager.clear();
            log.info("Final flush and clear after processing all vehicles");

            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronizationAdapter() {
                @Override
                public void afterCommit() {
                    log.info("Transaction committed successfully");
                }
            });

            log.info("Finished processing batch of vehicles");
        } catch (Exception e) {
            log.error("Error processing batch of vehicles", e);
            throw e;
        }
    }

    @Transactional
    public void saveOrUpdateVehicle(Vehicle vehicle) {
        Vehicle existingVehicle = vehicleRepository.findById(vehicle.getId()).orElse(null);

        if (existingVehicle == null) {
            // New vehicle
            vehicleRepository.save(vehicle);
            log.info("Saved new vehicle: ID={}", vehicle.getId());
        } else {
            // Update existing vehicle with non-null fields
            boolean changed = updateVehicle(existingVehicle, vehicle);
            if (changed) {
                vehicleRepository.save(existingVehicle);
                log.info("Updated existing vehicle: ID={}", existingVehicle.getId());
            } else {
                log.info("No changes for existing vehicle: ID={}", existingVehicle.getId());
            }
        }
    }

    @Transactional(readOnly = true)
    public void verifyVehiclePersistence(String vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(Integer.valueOf(vehicleId)).orElse(null);
        if (vehicle != null) {
            log.info("Vehicle found after update: ID={}, Make={}, Model={}", vehicle.getId(), vehicle.getMake(), vehicle.getModel());
        } else {
            log.warn("Vehicle not found after update: ID={}", vehicleId);
        }
    }

    private boolean updateVehicle(Vehicle existingVehicle, Vehicle newVehicle) {
        boolean changed = false;

        if (newVehicle.getMake() != null) {
            existingVehicle.setMake(newVehicle.getMake());
            changed = true;
        }
        if (newVehicle.getModel() != null) {
            existingVehicle.setModel(newVehicle.getModel());
            changed = true;
        }
        if (newVehicle.getYear() != null) {
            existingVehicle.setYear(newVehicle.getYear());
            changed = true;
        }
        if (newVehicle.getTrim() != null) {
            existingVehicle.setTrim(newVehicle.getTrim());
            changed = true;
        }
        if (newVehicle.getType() != null) {
            existingVehicle.setType(newVehicle.getType());
            changed = true;
        }
        if (newVehicle.getRegistrationState() != null) {
            existingVehicle.setRegistrationState(newVehicle.getRegistrationState());
            changed = true;
        }
        if (newVehicle.getCity() != null) {
            existingVehicle.setCity(newVehicle.getCity());
            changed = true;
        }
        if (newVehicle.getState() != null) {
            existingVehicle.setState(newVehicle.getState());
            changed = true;
        }
        if (newVehicle.getAverageDailyPrice() != null) {
            existingVehicle.setAverageDailyPrice(newVehicle.getAverageDailyPrice());
            changed = true;
        }
        if (newVehicle.getCountry() != null) {
            existingVehicle.setCountry(newVehicle.getCountry());
            changed = true;
        }
        if (newVehicle.getCellId() != null) {
            existingVehicle.setCellId(newVehicle.getCellId());
            changed = true;
        }
        if (newVehicle.getPricingLastUpdated() != null) {
            existingVehicle.setPricingLastUpdated(newVehicle.getPricingLastUpdated());
            changed = true;
        }
        if (newVehicle.getSearchLastUpdated() != null) {
            existingVehicle.setSearchLastUpdated(newVehicle.getSearchLastUpdated());
            changed = true;
        }
        if (newVehicle.getDetailLastUpdated() != null) {
            existingVehicle.setDetailLastUpdated(newVehicle.getDetailLastUpdated());
            changed = true;
        }
        if (newVehicle.getStatus() != null) {
            existingVehicle.setStatus(newVehicle.getStatus());
            changed = true;
        }

        return changed;
    }
}