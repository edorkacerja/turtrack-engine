package com.example.turtrackmanager.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static com.example.turtrackmanager.util.Constants.RabbitMQ.*;


@Configuration
@Slf4j
public class RabbitMQConfig {

    @Bean
    public Queue toBeScrapedCellsQueue() {
        return new Queue(TO_BE_SCRAPED_CELLS_QUEUE, true);
    }

    @Bean
    public Queue toBeScrapedDrAvailabilityQueue() {
        return new Queue(TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE, true);
    }

    @Bean
    public Queue toBeScrapedVehicleDetailsQueue() {
        return new Queue(TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE, true);
    }

    @Bean
    public Queue scrapedCellsQueue() {
        return new Queue(SCRAPED_CELLS_QUEUE, true);
    }

    @Bean
    public Queue scrapedVehicleDetailsQueue() {
        return new Queue(SCRAPED_VEHICLE_DETAILS_QUEUE, true);
    }

    @Bean
    public Queue scrapedDrAvailabilityQueue() {
        return new Queue(SCRAPED_DR_AVAILABILITY_QUEUE, true);
    }

    @Bean
    public Queue scrapedVehicleSkeletonQueue() {
        return new Queue(SCRAPED_VEHICLE_SKELETON_QUEUE, true);
    }

    @Bean
    public Queue dlqCellsQueue() {
        return new Queue(DLQ_CELLS_QUEUE, true);
    }

    @Bean
    public Queue dlqDrAvailabilityQueue() {
        return new Queue(DLQ_DR_AVAILABILITY_QUEUE, true);
    }

    @Bean
    public Queue dlqVehicleDetailsQueue() {
        return new Queue(DLQ_VEHICLE_DETAILS_QUEUE, true);
    }

    @Bean
    public TopicExchange exchange() {
        log.info("Declaring TopicExchange: turtrack.exchange");
        return new TopicExchange("turtrack.exchange");
    }
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }

    // Bindings
    @Bean
    public Binding toBeScrapedCellsBinding(Queue toBeScrapedCellsQueue, TopicExchange exchange) {
        return BindingBuilder.bind(toBeScrapedCellsQueue).to(exchange).with(TO_BE_SCRAPED_CELLS_QUEUE);
    }

    @Bean
    public Binding toBeScrapedDrAvailabilityBinding(Queue toBeScrapedDrAvailabilityQueue, TopicExchange exchange) {
        return BindingBuilder.bind(toBeScrapedDrAvailabilityQueue).to(exchange).with(TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE);
    }

    @Bean
    public Binding toBeScrapedVehicleDetailsBinding(Queue toBeScrapedVehicleDetailsQueue, TopicExchange exchange) {
        return BindingBuilder.bind(toBeScrapedVehicleDetailsQueue).to(exchange).with(TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE);
    }

    // Add similar bindings for other queues...
}