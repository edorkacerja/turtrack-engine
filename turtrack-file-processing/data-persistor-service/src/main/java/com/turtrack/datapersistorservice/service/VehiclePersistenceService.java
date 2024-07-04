package com.turtrack.datapersistorservice.service;

import com.turtrack.datapersistorservice.model.Vehicle;
import com.turtrack.datapersistorservice.repository.VehicleRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
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
        log.info("Processing batch of {} vehicles", vehicles.size());
        for (int i = 0; i < vehicles.size(); i++) {
            Vehicle vehicle = vehicles.get(i);
            entityManager.merge(vehicle);
            if (i % 50 == 0 && i > 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
        log.info("Finished processing batch of vehicles");
    }


    @Transactional
    public void saveOrUpdateVehicle(Vehicle vehicle) {
        Vehicle existingVehicle = vehicleRepository.findById(vehicle.getId()).orElse(null);

        if (existingVehicle == null) {
            // New vehicle
//            vehicle.setLastUpdated(LocalDateTime.now());
            vehicleRepository.save(vehicle);
        } else if (hasChanged(existingVehicle, vehicle)) {
            // Update existing vehicle
            updateVehicle(existingVehicle, vehicle);
            vehicleRepository.save(existingVehicle);
        }
        // If the vehicle exists and hasn't changed, do nothing
    }

    private boolean hasChanged(Vehicle existingVehicle, Vehicle newVehicle) {
        return !existingVehicle.getMake().equals(newVehicle.getMake())
                || !existingVehicle.getModel().equals(newVehicle.getModel())
                || !existingVehicle.getYear().equals(newVehicle.getYear())
                || !existingVehicle.getTrim().equals(newVehicle.getTrim())
                || !existingVehicle.getType().equals(newVehicle.getType())
                || !existingVehicle.getRegistrationState().equals(newVehicle.getRegistrationState())
                || !existingVehicle.getCity().equals(newVehicle.getCity())
                || !existingVehicle.getState().equals(newVehicle.getState())
                || !existingVehicle.getAverageDailyPrice().equals(newVehicle.getAverageDailyPrice());
    }

    private void updateVehicle(Vehicle existingVehicle, Vehicle newVehicle) {
        existingVehicle.setMake(newVehicle.getMake());
        existingVehicle.setModel(newVehicle.getModel());
        existingVehicle.setYear(newVehicle.getYear());
        existingVehicle.setTrim(newVehicle.getTrim());
        existingVehicle.setType(newVehicle.getType());
        existingVehicle.setRegistrationState(newVehicle.getRegistrationState());
        existingVehicle.setCity(newVehicle.getCity());
        existingVehicle.setState(newVehicle.getState());
        existingVehicle.setAverageDailyPrice(newVehicle.getAverageDailyPrice());
//        existingVehicle.setLastUpdated(LocalDateTime.now());
    }
}