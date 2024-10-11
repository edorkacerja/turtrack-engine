package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.kafka.producer.KafkaProducer;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.model.manager.OptimalCell;
import com.example.turtrackmanager.model.turtrack.Cell;
import com.example.turtrackmanager.repository.manager.JobRepository;
import com.example.turtrackmanager.repository.manager.OptimalCellRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static com.example.turtrackmanager.util.Constants.CALIBRATOR_URL;
import static com.example.turtrackmanager.util.Constants.Kafka.TO_BE_SCRAPED_CELLS_TOPIC;

@Service
@Slf4j
@RequiredArgsConstructor
public class SearchJobService {
    private final JobRepository jobRepository;
    private final RestTemplate restTemplate;
    private final KafkaTemplate<String, Cell> searchKafkaTemplate;
    private final KafkaTemplate<String, OptimalCell> optimalCellSearchKafkaTemplate;
    private final OptimalCellRepository optimalCellRepository;


    @Transactional
    public Job createAndStartSearchJob(Map<String, Object> searchParams) {

        Job job = Job.builder()
                .title("Search Job")
                .status(Job.JobStatus.CREATED)
                .jobType(Job.JobType.SEARCH)
                .createdAt(LocalDateTime.now())
                .build();

        job = jobRepository.save(job);
        log.info("Created search job: {}", job);

        try {
            // Process and store search parameters
            job.setTotalItems((int)searchParams.get("limit") - (int) searchParams.get("startAt"));
            job = startJob(job, searchParams);
        } catch (Exception e) {
            log.error("Failed to start search job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
            job = jobRepository.save(job);
        }

        return job;
    }

    @Transactional
    public Job startJob(Job job, Map<String, Object> searchParams) {
        log.info("Starting job: {}", job);

        List<Cell> baseCells = new ArrayList<>();
        List<OptimalCell> optimalCells = new ArrayList<>();

        boolean fromOptimalCells = (boolean)searchParams.get("fromOptimalCells");



        try {

            if(fromOptimalCells) {

                optimalCells = optimalCellRepository.findAll();

                // Send cells to Kafka
                optimalCells.forEach(cell ->
                        optimalCellSearchKafkaTemplate.send(TO_BE_SCRAPED_CELLS_TOPIC, String.valueOf(cell.getId()), cell)
                );

                log.info("Sent {} cells to Kafka.", optimalCells.size());

                job.setStatus(Job.JobStatus.RUNNING);
                job.setStartedAt(LocalDateTime.now());
                log.info("Job started: {}. Sent {} cells to Kafka.", job.getId(), optimalCells.size());



            } else {

                // Call calibrator endpoint
                baseCells = callCalibratorEndpoint(searchParams);

                // Send cells to Kafka
                baseCells.forEach(cell ->
                        searchKafkaTemplate.send(TO_BE_SCRAPED_CELLS_TOPIC, String.valueOf(cell.getId()), cell)
                );

                log.info("Sent {} cells to Kafka.", baseCells.size());

                job.setStatus(Job.JobStatus.RUNNING);
                job.setStartedAt(LocalDateTime.now());
                log.info("Job started: {}. Sent {} cells to Kafka.", job.getId(), baseCells.size());


            }

        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }


    private List<Cell> callCalibratorEndpoint(Map<String, Object> params) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Arrays.asList(MediaType.ALL));
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(params, headers);

        String url = CALIBRATOR_URL + "/api/v1/calibrator/calibrate";

        List<LinkedHashMap<String, Object>> baseGrid = restTemplate.postForObject(url, requestEntity, List.class);

        List<Cell> processedGrid = new ArrayList<>();

        if (baseGrid != null) {
            for (LinkedHashMap<String, Object> cellData : baseGrid) {
                LinkedHashMap<String, Double> bottomLeftCoords = (LinkedHashMap<String, Double>) cellData.get("bottom_left_coords");
                LinkedHashMap<String, Double> topRightCoords = (LinkedHashMap<String, Double>) cellData.get("top_right_coords");

                Cell processedCell = new Cell()
                        .setBottomLeftLat(bottomLeftCoords.get("lat"))
                        .setBottomLeftLng(bottomLeftCoords.get("lng"))
                        .setTopRightLat(topRightCoords.get("lat"))
                        .setTopRightLng(topRightCoords.get("lng"))
                        .setCellSize((Integer) cellData.get("cell_size"))
                        .setCountry((String) params.get("country"))
                        .setId((String) cellData.get("temp_id"));

                processedGrid.add(processedCell);
            }

        }

        return processedGrid;
    }

}