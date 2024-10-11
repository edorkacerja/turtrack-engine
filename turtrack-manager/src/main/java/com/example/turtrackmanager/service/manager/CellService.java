package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.model.manager.OptimalCell;
import com.example.turtrackmanager.repository.manager.OptimalCellRepository;
import com.example.turtrackmanager.service.manager.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CellService {

    private final JobService jobService;
    private final OptimalCellRepository optimalCellRepository;

    public void processCell(Map<String, Object> message) {
        if (message.containsKey("baseCell") && message.containsKey("optimalCell")) {

            Map<String, Object> baseCellObj = (Map<String, Object>) message.get("baseCell");
            Map<String, Object> optimalCellObj = (Map<String, Object>) message.get("optimalCell");

            String baseCellId = (String) baseCellObj.get("id");
            String optimalCellId = (String) optimalCellObj.get("id");

            // Parse baseId
            UUID baseId = parseOrGenerateUUID(baseCellId);
            // Parse optimalId
            UUID optimalId = parseOrGenerateUUID(optimalCellId);

            Optional<OptimalCell> baseCell = optimalCellRepository.findById(baseId);

            if (baseCellId.equals(optimalCellId)) {

                if (baseCell.isEmpty()) {
                    OptimalCell optimalCellToSave = OptimalCell.builder()
                            .id(baseId) // Use baseId (parsed or generated)
                            .country((String) optimalCellObj.get("country"))
                            .cellSize((Integer) optimalCellObj.get("cellSize"))
                            .topRightLat((Double) optimalCellObj.get("topRightLat"))
                            .topRightLng((Double) optimalCellObj.get("topRightLng"))
                            .bottomLeftLat((Double) optimalCellObj.get("bottomLeftLat"))
                            .bottomLeftLng((Double) optimalCellObj.get("bottomLeftLng"))
                            .build();
                    optimalCellRepository.save(optimalCellToSave);
                }

            } else {

                baseCell.ifPresent(optimalCellRepository::delete);

                OptimalCell optimalCellToSave = OptimalCell.builder()
                        .id(optimalId) // Use optimalId (parsed or generated)
                        .country((String) optimalCellObj.get("country"))
                        .cellSize((Integer) optimalCellObj.get("cellSize"))
                        .topRightLat((Double) optimalCellObj.get("topRightLat"))
                        .topRightLng((Double) optimalCellObj.get("topRightLng"))
                        .bottomLeftLat((Double) optimalCellObj.get("bottomLeftLat"))
                        .bottomLeftLng((Double) optimalCellObj.get("bottomLeftLng"))
                        .build();

                optimalCellRepository.save(optimalCellToSave);
            }
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
