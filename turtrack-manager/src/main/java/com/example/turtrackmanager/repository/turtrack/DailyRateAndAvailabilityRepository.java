package com.example.turtrackmanager.repository.turtrack;

import com.example.turtrackmanager.model.turtrack.DailyRateAndAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyRateAndAvailabilityRepository extends JpaRepository<DailyRateAndAvailability, Long> {
}
