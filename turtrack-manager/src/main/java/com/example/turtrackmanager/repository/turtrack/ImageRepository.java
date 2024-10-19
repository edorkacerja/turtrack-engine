package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {
    Optional<Image> findByExternalId(Long externalId);
}
