package com.turtrack.datapersistorservice.repository;

import com.turtrack.datapersistorservice.model.DailyRateAndAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyRateAndAvailabilityRepository extends JpaRepository<DailyRateAndAvailability, Long> {

}
