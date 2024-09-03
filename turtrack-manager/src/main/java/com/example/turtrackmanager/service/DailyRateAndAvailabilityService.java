package com.example.turtrackmanager.service;

import com.example.turtrackmanager.model.turtrack.DailyRateAndAvailability;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.repository.manager.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.example.turtrackmanager.util.Constants.Kafka.PROCESSED_DR_AVAILABILITY_TOPIC;

@Service
@Slf4j
@RequiredArgsConstructor
public class DailyRateAndAvailabilityService {

    private final KafkaTemplate<String, DailyRateAndAvailability> kafkaTemplate;
    private final JobRepository jobRepository;


    @Transactional
    public void processFailedVehicle(Map<String, Object> message) {
        Long jobId = extractJobId(message);
        updateJobForFailedVehicle(jobId);
    }

    private void updateJobForFailedVehicle(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        // Increment the failed items count
        job.setFailedItems(job.getFailedItems() == null ? 1 : job.getFailedItems() + 1);

//        // Update the job status
//        job.setStatus(Job.JobStatus.PARTIALLY_COMPLETED);

        // Update completion percentage
        if (job.getTotalItems() != null && job.getTotalItems() > 0) {
            int processedItems = (job.getCompletedItems() == null ? 0 : job.getCompletedItems())
                    + (job.getFailedItems() == null ? 0 : job.getFailedItems());
            double percentCompleted = (double) processedItems / job.getTotalItems() * 100;
            job.setPercentCompleted(percentCompleted);

            if (processedItems >= job.getTotalItems()) {
                job.setStatus(Job.JobStatus.FINISHED);
                job.setFinishedAt(LocalDateTime.now());
            }
        } else {
            log.warn("Job {} has no total items set. Unable to calculate percent completed.", jobId);
        }

        jobRepository.save(job);
        log.info("Updated job for failed vehicle: jobId={}, failedItems={}, percentCompleted={}%, status={}",
                jobId, job.getFailedItems(), job.getPercentCompleted(), job.getStatus());
    }




    @Transactional
    public void processAndForwardDailyRates(Map<String, Object> message) {
        Long vehicleId = extractVehicleId(message);
        Long jobId = extractJobId(message);
        List<DailyRateAndAvailability> dailyRates = extractDailyRates(message, vehicleId);

        for (DailyRateAndAvailability dailyRate : dailyRates) {
            forwardDailyRate(dailyRate);
        }

//        updateJobProgress(jobId, dailyRates.size());
        updateJobProgress(jobId, 1);
    }

    private List<DailyRateAndAvailability> extractDailyRates(Map<String, Object> message, Long vehicleId) {
        List<DailyRateAndAvailability> dailyRates = new ArrayList<>();
        List<Map<String, Object>> dailyPricingResponses = (List<Map<String, Object>>) message.get("dailyPricingResponses");

        for (Map<String, Object> dailyPricing : dailyPricingResponses) {
            DailyRateAndAvailability dailyRate = createDailyRate(dailyPricing, vehicleId);
            dailyRates.add(dailyRate);
        }

        return dailyRates;
    }

    private DailyRateAndAvailability createDailyRate(Map<String, Object> dailyPricing, Long vehicleId) {
        DailyRateAndAvailability dailyRate = new DailyRateAndAvailability();
        LocalDate date = LocalDate.parse((String) dailyPricing.get("date"));
        dailyRate.setId(new DailyRateAndAvailability.DailyRateAndAvailabilityId(vehicleId, date));
        dailyRate.setLocalizedDayOfWeek((String) dailyPricing.get("localizedDayOfWeek"));
        dailyRate.setPrice(convertToDouble(dailyPricing.get("price")));
        dailyRate.setWholeDayUnavailable((Boolean) dailyPricing.get("wholeDayUnavailable"));

        Map<String, Object> priceWithCurrency = (Map<String, Object>) dailyPricing.get("priceWithCurrency");
        dailyRate.setCurrencyCode((String) priceWithCurrency.get("currencyCode"));

        return dailyRate;
    }

    private Long extractVehicleId(Map<String, Object> message) {
        String vehicleIdStr = (String) message.get("vehicleId");
        return Long.parseLong(vehicleIdStr);
    }

    private Long extractJobId(Map<String, Object> message) {
        String jobIdStr = (String) message.get("jobId");
        return Long.parseLong(jobIdStr);
    }

    private Double convertToDouble(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        } else if (value instanceof String) {
            return Double.parseDouble((String) value);
        }
        throw new IllegalArgumentException("Cannot convert " + value + " to Double");
    }

    private void forwardDailyRate(DailyRateAndAvailability dailyRate) {
        kafkaTemplate.send(PROCESSED_DR_AVAILABILITY_TOPIC, dailyRate);
    }

    private void updateJobProgress(Long jobId, int processedItems) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found with id: " + jobId));

        // Initialize completedItems if it's null
        if (job.getCompletedItems() == null) {
            job.setCompletedItems(0);
        }

        int newCompletedItems = job.getCompletedItems() + processedItems;
        job.setCompletedItems(newCompletedItems);

        if (job.getTotalItems() != null && job.getTotalItems() > 0) {
            double percentCompleted = (double) newCompletedItems / job.getTotalItems() * 100;
            job.setPercentCompleted(percentCompleted);

            if (newCompletedItems >= job.getTotalItems()) {
                job.setStatus(Job.JobStatus.FINISHED);
                job.setFinishedAt(LocalDateTime.now());
            }
        } else {
            log.warn("Job {} has no total items set. Unable to calculate percent completed.", jobId);
        }

        jobRepository.save(job);
        log.info("Updated job progress: jobId={}, completedItems={}, percentCompleted={}%",
                jobId, newCompletedItems, job.getPercentCompleted());
    }
}