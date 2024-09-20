package com.example.turtrackmanager.config.kafka;

import com.example.turtrackmanager.dto.ToBeScrapedVehicleKafkaMessage;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

import static com.example.turtrackmanager.util.Constants.Kafka.*;

@Configuration
@Slf4j
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public KafkaAdmin kafkaAdmin() {
        Map<String, Object> configs = new HashMap<>();
        configs.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        return new KafkaAdmin(configs);
    }

    @Bean
    public NewTopic toBeScrapedCellsTopic() {
        return TopicBuilder.name(TO_BE_SCRAPED_CELLS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic toBeScrapedDrAvailabilityTopic() {
        return TopicBuilder.name(TO_BE_SCRAPED_DR_AVAILABILITY_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic toBeScrapedVehicleDetailsTopic() {
        return TopicBuilder.name(TO_BE_SCRAPED_VEHICLE_DETAILS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic scrapedVehicleDetailsTopic() {
        return TopicBuilder.name(SCRAPED_VEHICLE_DETAILS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic scrapedDrAvailabilityTopic() {
        return TopicBuilder.name(SCRAPED_DR_AVAILABILITY_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic scrapedVehicleSkeletonTopic() {
        return TopicBuilder.name(SCRAPED_VEHICLE_SKELETON_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic processedDrAvailabilityTopic() {
        return TopicBuilder.name(PROCESSED_DR_AVAILABILITY_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic processedVehicleDetailsTopic() {
        return TopicBuilder.name(PROCESSED_VEHICLE_DETAILS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic processedVehicleSkeletonTopic() {
        return TopicBuilder.name(PROCESSED_VEHICLE_SKELETON_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic dlqCellsTopic() {
        return TopicBuilder.name(DLQ_CELLS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic dlqDrAvailabilityTopic() {
        return TopicBuilder.name(DLQ_DR_AVAILABILITY_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic dlqVehicleDetailsTopic() {
        return TopicBuilder.name(DLQ_VEHICLE_DETAILS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }

    @Bean
    public ProducerFactory<String, ToBeScrapedVehicleKafkaMessage> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(CommonClientConfigs.CLIENT_DNS_LOOKUP_CONFIG, "use_all_dns_ips");

        log.info("Kafka bootstrap servers: {}", bootstrapServers);
        log.info("Producer config: {}", configProps);

        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, ToBeScrapedVehicleKafkaMessage> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}