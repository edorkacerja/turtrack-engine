package com.example.turtrackmanager.config.kafka;
import com.example.turtrackmanager.dto.ToBeScrapedCellMessage;
import com.example.turtrackmanager.model.turtrack.DailyRateAndAvailability;
import com.example.turtrackmanager.model.turtrack.Vehicle;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonSerializer;


import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    private final ObjectMapper jsonObjectMapper;

    public KafkaProducerConfig(ObjectMapper jsonObjectMapper) {
        this.jsonObjectMapper = jsonObjectMapper;
    }

    @Bean
    public ProducerFactory<String, Vehicle> vehicleSkeletonProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public ProducerFactory<String, Vehicle> vehicleProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public ProducerFactory<String, DailyRateAndAvailability> dailyRateProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps, new StringSerializer(), new JsonSerializer<>(jsonObjectMapper));
    }

    @Bean
    public ProducerFactory<String, ToBeScrapedCellMessage> cellProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps, new StringSerializer(), new JsonSerializer<>(jsonObjectMapper));
    }

    @Bean
    public ProducerFactory<String, ToBeScrapedCellMessage> optimalCellProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps, new StringSerializer(), new JsonSerializer<>(jsonObjectMapper));
    }

    @Bean
    public KafkaTemplate<String, Vehicle> vehicleSkeletonKafkaTemplate() {
        return new KafkaTemplate<>(vehicleSkeletonProducerFactory());
    }

    @Bean
    public KafkaTemplate<String, Vehicle> vehicleDetailsKafkaTemplate() {
        return new KafkaTemplate<>(vehicleProducerFactory());
    }

    @Bean
    public KafkaTemplate<String, DailyRateAndAvailability> dailyRateAndAvailabilityKafkaTemplate() {
        return new KafkaTemplate<>(dailyRateProducerFactory());
    }

    @Bean
    public KafkaTemplate<String, ToBeScrapedCellMessage> searchKafkaTemplate() {
        return new KafkaTemplate<>(cellProducerFactory());
    }
    @Bean
    public KafkaTemplate<String, ToBeScrapedCellMessage> optimalCellSearchKafkaTemplate() {
        return new KafkaTemplate<>(optimalCellProducerFactory());
    }
}