package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.Owner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OwnerRepository extends JpaRepository<Owner, Long> {
    Optional<Owner> findByExternalId(Long externalId);
}
