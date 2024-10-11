package com.example.turtrackmanager.repository.manager;

import com.example.turtrackmanager.model.manager.OptimalCell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface OptimalCellRepository extends JpaRepository<OptimalCell, UUID> {
    List<OptimalCell> findByCellSize(int cellSize);
}
