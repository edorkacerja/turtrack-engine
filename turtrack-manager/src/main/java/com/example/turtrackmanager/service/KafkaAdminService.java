package com.example.turtrackmanager.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaAdminService {

    private final KafkaAdmin kafkaAdmin;

    public void createTopic(String topicName, int numPartitions, short replicationFactor) {
        NewTopic newTopic = new NewTopic(topicName, numPartitions, replicationFactor);

        try (AdminClient adminClient = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            adminClient.createTopics(Collections.singleton(newTopic)).all().get();
            log.info("Created new Kafka topic: {}", topicName);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Failed to create Kafka topic: {}", topicName, e);
            throw new RuntimeException("Failed to create Kafka topic", e);
        }
    }

    public void deleteTopic(String topicName) {
        try (AdminClient adminClient = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            adminClient.deleteTopics(Collections.singleton(topicName)).all().get();
            log.info("Deleted Kafka topic: {}", topicName);
        } catch (ExecutionException | InterruptedException e) {
            log.error("Failed to delete Kafka topic: {}", topicName, e);
            throw new RuntimeException("Failed to delete Kafka topic", e);
        }
    }
}