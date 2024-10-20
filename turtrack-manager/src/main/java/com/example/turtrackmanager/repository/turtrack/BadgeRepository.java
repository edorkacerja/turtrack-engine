package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByExternalId(Long externalId);
}
