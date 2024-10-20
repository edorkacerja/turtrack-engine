package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.model.manager.OptimalCell;
import com.example.turtrackmanager.model.turtrack.Vehicle;
import com.example.turtrackmanager.repository.manager.JobRepository;
import com.example.turtrackmanager.repository.manager.OptimalCellRepository;
import com.example.turtrackmanager.repository.turtrack.VehicleRepository;
import com.example.turtrackmanager.service.turtrack.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.example.turtrackmanager.util.DateTimeUtil.convertStringToDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CellService {

    private final JobService jobService;
    private final JobRepository jobRepository;
    private final OptimalCellRepository optimalCellRepository;
    private final VehicleService vehicleService;
    private final VehicleRepository vehicleRepository;

    @Transactional
    public void processCell(Map<String, Object> message) throws Exception {
        try {
            if (!message.containsKey("baseCell") || !message.containsKey("optimalCell")) {
                throw new IllegalArgumentException("Message must contain both 'baseCell' and 'optimalCell'");
            }

            Map<String, Object> baseCellObj = (Map<String, Object>) message.get("baseCell");
            Map<String, Object> optimalCellObj = (Map<String, Object>) message.get("optimalCell");
            Boolean updateOptimalCell = (Boolean) message.getOrDefault("updateOptimalCell", false);
            Long jobId = Long.parseLong(String.valueOf(message.get("jobId")));

            jobService.incrementCompletedItems(jobId, 1);

            String baseCellId = (String) baseCellObj.get("id");
            String optimalCellId = (String) optimalCellObj.get("id");

            UUID baseId = parseOrGenerateUUID(baseCellId);
            UUID optimalId = parseOrGenerateUUID(optimalCellId);

            if (Boolean.TRUE.equals(updateOptimalCell)) {
                updateOptimalCell(baseCellId, optimalCellId, baseId, optimalId, optimalCellObj);
            }

            processScrapedVehicles(message);

        } catch (Exception e) {
            log.error("Error processing cell: ", e);
            throw new RuntimeException("Failed to process cell", e);
        }
    }

    private void updateOptimalCell(String baseCellId, String optimalCellId, UUID baseId, UUID optimalId, Map<String, Object> optimalCellObj) {
        if (baseCellId.equals(optimalCellId)) {
            saveOptimalCell(baseId, optimalCellObj);
        } else {
            optimalCellRepository.findById(baseId).ifPresent(optimalCellRepository::delete);
            saveOptimalCell(optimalId, optimalCellObj);
        }
    }

    private void saveOptimalCell(UUID id, Map<String, Object> cellObj) {
        OptimalCell optimalCellToSave = OptimalCell.builder()
                .id(id)
                .country((String) cellObj.get("country"))
                .cellSize((Integer) cellObj.get("cellSize"))
                .topRightLat((Double) cellObj.get("topRightLat"))
                .topRightLng((Double) cellObj.get("topRightLng"))
                .bottomLeftLat((Double) cellObj.get("bottomLeftLat"))
                .bottomLeftLng((Double) cellObj.get("bottomLeftLng"))
                .build();
        optimalCellRepository.save(optimalCellToSave);
    }

    private void processScrapedVehicles(Map<String, Object> message) {
        if (message.containsKey("scraped") && message.get("scraped") instanceof Map) {
            Map<String, Object> scraped = (Map<String, Object>) message.get("scraped");

            if (scraped.containsKey("vehicles") && scraped.get("vehicles") instanceof List) {
                List<Object> vehicles = (List<Object>) scraped.get("vehicles");

                List<Vehicle> processedVehicles = vehicles.stream()
                        .filter(v -> v instanceof Map)
                        .map(v -> (Map<String, Object>) v)
                        .map(this::buildVehicle)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

                if (!processedVehicles.isEmpty()) {
                    log.info("Processed {} vehicles", processedVehicles.size());
                }
            }
        }
    }

    private Vehicle buildVehicle(Map<String, Object> vehicleMap) {
        try {
            Long externalId = Long.parseLong(String.valueOf(vehicleMap.get("id")));
            LocalDateTime searchLastUpdated = convertStringToDateTime((String) vehicleMap.get("searchLastUpdated"));

            // First, try to find the vehicle in the database
            Optional<Vehicle> existingVehicle = vehicleRepository.findByExternalId(externalId);

            if (existingVehicle.isPresent()) {
                // If the vehicle exists, update its searchLastUpdated
                Vehicle vehicle = existingVehicle.get();
                vehicle.setSearchLastUpdated(searchLastUpdated);
                return vehicleRepository.save(vehicle);
            } else {
                // If the vehicle doesn't exist, create a new one
                return vehicleRepository.save(Vehicle.builder()
                        .externalId(externalId)
                        .searchLastUpdated(searchLastUpdated)
                        .build());
            }
        } catch (NumberFormatException e) {
            log.error("Error parsing vehicle ID: ", e);
            return null;
        } catch (Exception e) {
            log.error("Error building or updating vehicle: ", e);
            return null;
        }
    }

    private UUID parseOrGenerateUUID(Object idObj) {
        if (idObj instanceof String) {
            String idStr = (String) idObj;
            try {
                return UUID.fromString(idStr);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID format '{}', generating new UUID.", idStr);
            }
        } else {
            log.warn("ID is not a string, generating new UUID.");
        }
        return UUID.randomUUID();
    }
}