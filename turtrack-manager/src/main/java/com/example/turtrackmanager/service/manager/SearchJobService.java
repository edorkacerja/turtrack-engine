package com.example.turtrackmanager.service.manager;

import com.example.turtrackmanager.dto.CreateSearchJobDTO;
import com.example.turtrackmanager.dto.ToBeScrapedCellMessage;
import com.example.turtrackmanager.model.manager.Job;
import com.example.turtrackmanager.model.manager.OptimalCell;
import com.example.turtrackmanager.model.turtrack.Cell;
import com.example.turtrackmanager.rabbitmq.producer.RabbitMQProducer;
import com.example.turtrackmanager.repository.manager.JobRepository;
import com.example.turtrackmanager.repository.manager.OptimalCellRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.example.turtrackmanager.util.Constants.CALIBRATOR_URL;
import static com.example.turtrackmanager.util.Constants.RabbitMQ.TO_BE_SCRAPED_CELLS_QUEUE;

@Service
@Slf4j
@RequiredArgsConstructor
public class SearchJobService {
    private final JobRepository jobRepository;
    private final RestTemplate restTemplate;
    private final OptimalCellRepository optimalCellRepository;
    private final RabbitMQProducer rabbitMQProducer;

    @Transactional
    public Job createAndStartSearchJob(CreateSearchJobDTO createSearchJobDTO) {
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
            job.setTotalItems(createSearchJobDTO.getLimit() - createSearchJobDTO.getStartAt());
            job = startJob(job, createSearchJobDTO);
        } catch (Exception e) {
            log.error("Failed to start search job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
            job = jobRepository.save(job);
        }

        return job;
    }

    @Transactional
    public Job startJob(Job job, CreateSearchJobDTO createSearchJobDTO) {
        log.info("Starting job: {}", job);

        try {
            int startAt = createSearchJobDTO.getStartAt();
            int limit = createSearchJobDTO.getLimit();
            int totalCountOfCellsToBeScraped = limit == 0 ? -1 : limit - startAt;

            boolean fromOptimalCells = createSearchJobDTO.getFromOptimalCells();
            boolean updateOptimalCells = createSearchJobDTO.getUpdateOptimalCells();
            int cellSize = createSearchJobDTO.getCellSize();
            int recursiveDepth = createSearchJobDTO.getRecursiveDepth();

            String startDate = String.valueOf(createSearchJobDTO.getStartDate());
            String endDate = String.valueOf(createSearchJobDTO.getEndDate());

            if (fromOptimalCells) {
                List<OptimalCell> cells = optimalCellRepository.findByCellSize(cellSize);

                Stream<OptimalCell> cellStream = cells.stream()
                        .sorted(Comparator
                                .comparingDouble(OptimalCell::getBottomLeftLng)
                                .thenComparingDouble(OptimalCell::getBottomLeftLat))
                        .skip(startAt);

                if (limit != 0) {
                    cellStream = cellStream.limit(totalCountOfCellsToBeScraped);
                }

                List<OptimalCell> sortedCells = cellStream.collect(Collectors.toList());

                sortedCells.forEach(cell -> {
                    ToBeScrapedCellMessage toBeScrapedCellMessage = ToBeScrapedCellMessage.builder()
                            .id(cell.getId().toString())
                            .country(cell.getCountry())
                            .cellSize(cell.getCellSize())
                            .recursiveDepth(recursiveDepth)
                            .startDate(startDate)
                            .endDate(endDate)
                            .jobId(job.getId().toString())
                            .topRightLat(cell.getTopRightLat())
                            .topRightLng(cell.getTopRightLng())
                            .bottomLeftLat(cell.getBottomLeftLat())
                            .bottomLeftLng(cell.getBottomLeftLng())
                            .updateOptimalCell(updateOptimalCells)
                            .build();

                    try {
                        rabbitMQProducer.sendToBeScrapedCells(toBeScrapedCellMessage);
                        log.debug("Successfully sent message to RabbitMQ queue '{}': {}", TO_BE_SCRAPED_CELLS_QUEUE, toBeScrapedCellMessage);
                    } catch (Exception e) {
                        log.error("Failed to send message to RabbitMQ queue '{}': {}", TO_BE_SCRAPED_CELLS_QUEUE, toBeScrapedCellMessage, e);
                    }

                });

                log.info("Sent {} cells to Rabbit.", sortedCells.size());

                job.setStatus(Job.JobStatus.RUNNING);
                job.setStartedAt(LocalDateTime.now());
                job.setTotalItems(sortedCells.size());
                job.setCompletedItems(0);
                job.setFailedItems(0);
                job.setPercentCompleted(0.0);
                log.info("Job started: {}. Sent {} cells to Rabbit.", job.getId(), sortedCells.size());

            } else {
                List<Cell> baseCells = callCalibratorEndpoint(createSearchJobDTO);

                Stream<Cell> cellStream = baseCells.stream().skip(startAt);

                if (limit != 0) {
                    cellStream = cellStream.limit(totalCountOfCellsToBeScraped);
                }

                List<Cell> cellsToProcess = cellStream.collect(Collectors.toList());

                cellsToProcess.forEach(cell -> {
                    ToBeScrapedCellMessage kafkaMessage = ToBeScrapedCellMessage.builder()
                            .id(cell.getId().toString())
                            .country(cell.getCountry())
                            .cellSize(cell.getCellSize())
                            .recursiveDepth(recursiveDepth)
                            .startDate(startDate)
                            .endDate(endDate)
                            .jobId(job.getId().toString())
                            .topRightLat(cell.getTopRightLat())
                            .topRightLng(cell.getTopRightLng())
                            .bottomLeftLat(cell.getBottomLeftLat())
                            .bottomLeftLng(cell.getBottomLeftLng())
                            .updateOptimalCell(updateOptimalCells)
                            .build();

                    try {
                        rabbitMQProducer.sendToBeScrapedCells(kafkaMessage);
                        log.debug("Successfully sent message to RabbitMQ queue '{}': {}", TO_BE_SCRAPED_CELLS_QUEUE, kafkaMessage);
                    } catch (Exception e) {
                        log.error("Failed to send message to RabbitMQ queue '{}': {}", TO_BE_SCRAPED_CELLS_QUEUE, kafkaMessage, e);
                    }
                });

                log.info("Sent {} cells to Rabbit.", cellsToProcess.size());

                job.setStatus(Job.JobStatus.RUNNING);
                job.setStartedAt(LocalDateTime.now());
                job.setTotalItems(cellsToProcess.size());
                job.setCompletedItems(0);
                job.setFailedItems(0);
                job.setPercentCompleted(0.0);
                log.info("Job started: {}. Sent {} cells to Rabbit.", job.getId(), cellsToProcess.size());
            }

        } catch (Exception e) {
            log.error("Failed to start job: {}", job.getId(), e);
            job.setStatus(Job.JobStatus.FAILED);
        }

        return jobRepository.save(job);
    }

    private List<Cell> callCalibratorEndpoint(CreateSearchJobDTO createSearchJobDTO) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Arrays.asList(MediaType.ALL));
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CreateSearchJobDTO> requestEntity = new HttpEntity<>(createSearchJobDTO, headers);

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
                        .setCountry(createSearchJobDTO.getCountry())
                        .setId((String) cellData.get("temp_id"));

                processedGrid.add(processedCell);
            }

        }

        return processedGrid;
    }

}
