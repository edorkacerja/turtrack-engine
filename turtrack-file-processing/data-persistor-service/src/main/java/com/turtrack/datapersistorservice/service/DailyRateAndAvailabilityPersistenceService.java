package com.turtrack.datapersistorservice.service;

import com.turtrack.datapersistorservice.model.DailyRateAndAvailability;
import com.turtrack.datapersistorservice.repository.DailyRateAndAvailabilityRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyRateAndAvailabilityPersistenceService {

    private final DailyRateAndAvailabilityRepository dailyRateAndAvailabilityRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void saveOrUpdateDailyRates(List<DailyRateAndAvailability> dailyRates) {
        log.info("Processing batch of {} daily rates", dailyRates.size());
        for (int i = 0; i < dailyRates.size(); i++) {
            DailyRateAndAvailability dailyRate = dailyRates.get(i);
            entityManager.merge(dailyRate);
            if (i % 50 == 0 && i > 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
        log.info("Finished processing batch of daily rates");
    }

    @Transactional
    public void saveOrUpdateDailyRate(DailyRateAndAvailability dailyRate) {
//        DailyRateAndAvailability existingRate = dailyRateAndAvailabilityRepository
//                .findById(dailyRate.getId())
//                .orElse(null);

//        if (existingRate == null) {
            dailyRateAndAvailabilityRepository.save(dailyRate);
//        } else if (hasChanged(existingRate, dailyRate)) {
//            updateDailyRate(existingRate, dailyRate);
//            dailyRateAndAvailabilityRepository.save(existingRate);
//        }
    }

    private boolean hasChanged(DailyRateAndAvailability existingRate, DailyRateAndAvailability newRate) {
        return !existingRate.getCustomSetPrice().equals(newRate.getCustomSetPrice())
                || !existingRate.getLocalizedDayOfWeek().equals(newRate.getLocalizedDayOfWeek())
                || !existingRate.getPrice().equals(newRate.getPrice())
                || !existingRate.getCurrencyCode().equals(newRate.getCurrencyCode())
                || !existingRate.getWholeDayUnavailable().equals(newRate.getWholeDayUnavailable());
    }

    private void updateDailyRate(DailyRateAndAvailability existingRate, DailyRateAndAvailability newRate) {
        existingRate.setCustomSetPrice(newRate.getCustomSetPrice());
        existingRate.setLocalizedDayOfWeek(newRate.getLocalizedDayOfWeek());
        existingRate.setPrice(newRate.getPrice());
        existingRate.setCurrencyCode(newRate.getCurrencyCode());
        existingRate.setWholeDayUnavailable(newRate.getWholeDayUnavailable());
    }
}