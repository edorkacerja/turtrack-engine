package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findByExternalId(Long externalId);
}
