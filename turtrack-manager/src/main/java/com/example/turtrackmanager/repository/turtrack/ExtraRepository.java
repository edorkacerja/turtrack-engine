package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Extra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExtraRepository extends JpaRepository<Extra, Long> {
    Optional<Extra> findByExternalId(Long externalId);
}
