package com.example.turtrackmanager.service.turtrack;

import com.example.turtrackmanager.model.turtrack.Vehicle;
import com.example.turtrackmanager.repository.turtrack.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public List<Vehicle> getAllVehicles() {
        log.info("Fetching all vehicles");
        return vehicleRepository.findAll();
    }

    public List<Vehicle> getVehiclesWithLimit(int limit) {
        return vehicleRepository.findAll(PageRequest.of(0, limit)).getContent();
    }

    public Optional<Vehicle> getVehicleById(Long id) {
        log.info("Fetching vehicle with id: {}", id);
        return vehicleRepository.findById(id);
    }

    public Vehicle saveVehicle(Vehicle vehicle) {
        log.info("Saving vehicle: {}", vehicle);
        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> saveAllVehicles(List<Vehicle> vehicles) {
        log.info("Saving a list of {} vehicles", vehicles.size());
        return vehicleRepository.saveAll(vehicles);
    }

    public Vehicle updateVehicle(Long id, Vehicle updatedVehicle) {
        log.info("Updating vehicle with id: {}", id);
        if (vehicleRepository.existsById(id)) {
            updatedVehicle.setId(id);
            return vehicleRepository.save(updatedVehicle);
        }
        throw new RuntimeException("Vehicle not found with id: " + id);
    }

    public void deleteVehicle(Long id) {
        log.info("Deleting vehicle with id: {}", id);
        vehicleRepository.deleteById(id);
    }

    public List<Vehicle> getVehiclesWithLimitAndOffset(int limit, int offset) {
        Pageable pageable = PageRequest.of(offset / limit, limit);
        return vehicleRepository.findAll(pageable).getContent();
    }

}