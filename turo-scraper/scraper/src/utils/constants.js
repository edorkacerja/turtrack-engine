// utils/constants.js

'use strict';

module.exports = {
    // RabbitMQ Queues
    TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE: 'TO-BE-SCRAPED-vehicle-details-queue',
    TO_BE_SCRAPED_DR_AVAILABILITY_QUEUE: 'TO-BE-SCRAPED-dr-availability-queue',
    TO_BE_SCRAPED_CELLS_QUEUE: 'TO-BE-SCRAPED-cells-queue',
    DLQ_VEHICLE_DETAILS_QUEUE: 'DLQ-vehicle-details-queue',
    DLQ_DR_AVAILABILITY_QUEUE: 'DLQ-dr-availability-queue',
    DLQ_CELLS_QUEUE: 'DLQ-cells-queue',
    SCRAPED_VEHICLE_DETAILS_QUEUE: 'SCRAPED-vehicle-details-queue',
    SCRAPED_DR_AVAILABILITY_QUEUE: 'SCRAPED-dr-availability-queue',
    SCRAPED_CELLS_QUEUE: 'SCRAPED-cells-queue',

    // Kafka Topics
    TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_: 'TO-BE-SCRAPED-dr-availability-topic',
    TO_BE_SCRAPED_CELLS_TOPIC: 'TO-BE-SCRAPED-cells-topic',
    DLQ_TOPIC_DR_AVAILABILITY: 'DLQ-dr-availability-topic',
    DLQ_CELLS_TOPIC: 'DLQ-cells-topic',
    SCRAPED_TOPIC_DR_AVAILABILITY: 'SCRAPED-dr-availability-topic',
    SCRAPED_CELLS_TOPIC: 'SCRAPED-cells-topic',
    KAFKA_CLIENT_ID_PREFIX_DR_AVAILABILITY: 'availability-scraper-client',
    KAFKA_CLIENT_ID_PREFIX_SEARCH: 'search-scraper-client',
    KAFKA_CONSUMER_GROUP_ID_DR_AVAILABILITY: 'availability-scraper-group',
    KAFKA_CONSUMER_GROUP_ID_SEARCH: 'search-scraper-group',
    PROXY_AUTH: 'intellicode:T3yGrF8Nr63U7q8m',
    PROXY_SERVER: 'https://proxy.packetstream.io:31111'
};