package com.example.turtrackmanager.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQConnectionTest implements CommandLineRunner {

    private final RabbitTemplate rabbitTemplate;
    private static final Logger logger = LoggerFactory.getLogger(RabbitMQConnectionTest.class);

    @Autowired
    public RabbitMQConnectionTest(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            rabbitTemplate.convertAndSend("test-exchange", "test-routing-key", "Test Message");
            logger.info("Successfully connected to RabbitMQ and sent a test message");
        } catch (Exception e) {
            logger.error("Failed to connect to RabbitMQ: ", e);
        }
    }
}