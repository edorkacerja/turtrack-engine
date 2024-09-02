'use strict';

const { Kafka } = require('kafkajs');
const ScraperPool = require('../scrapers/ScraperPool');
const { sendToKafka, commitOffsetsWithRetry } = require('../utils/kafkaUtil');
const os = require('os');
const db = require("../config/db");
const {
    TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_,
    DLQ_TOPIC_DR_AVAILABILITY,
    SCRAPED_TOPIC_DR_AVAILABILITY,
    KAFKA_CLIENT_ID_PREFIX_DR_AVAILABILITY,
    KAFKA_CONSUMER_GROUP_ID_DR_AVAILABILITY
} = require('../utils/constants');

const INSTANCE_ID = os.hostname();
const proxyAuth = process.env.PROXY_AUTH;
const proxyServer = process.env.PROXY_SERVER;
const POOL_SIZE = 2;

const kafka = new Kafka({
    clientId: `${KAFKA_CLIENT_ID_PREFIX_DR_AVAILABILITY}-${INSTANCE_ID}`,
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const consumer = kafka.consumer({
    groupId: KAFKA_CONSUMER_GROUP_ID_DR_AVAILABILITY,
    maxInFlightRequests: 1,
    sessionTimeout: 60000,
    heartbeatInterval: 3000,
    retry: {
        initialRetryTime: 300,
        retries: 10
    },
    readUncommitted: false,
    autoCommit: false
});

let scraperPool;
let isShuttingDown = false;

async function startPricingConsumer() {
    while (true) {
        try {
            console.log(`Connecting to Kafka and subscribing to ${TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_}`);
            await consumer.connect();
            await consumer.subscribe({ topic: TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_ });

            console.log(`Initializing ScraperPool...`);
            scraperPool = new ScraperPool(POOL_SIZE, {
                proxyAuth,
                proxyServer,
                instanceId: INSTANCE_ID,
                consumer,
                handleFailedScrape,
                handleSuccessfulScrape
            });
            await scraperPool.initialize();

            await consumer.run({
                autoCommit: false,
                eachMessage: async ({ topic, partition, message }) => {
                    const messageData = JSON.parse(message.value.toString());
                    await processMessage(messageData, topic, partition, message);
                },
            });

            console.log(`Availability scraper consumer is now running and listening for messages`);
            break;
        } catch (error) {
            console.error(`Consumer error, attempting to reconnect:`, error);
            await consumer.disconnect().catch(() => {});
            if (scraperPool) {
                await scraperPool.close();
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function processMessage(messageData, topic, partition, message) {
    const { startDate, endDate, country, vehicleId, jobId } = messageData;

    console.log(`Consumed vehicle with id ${vehicleId} for availability scraping`);
    console.log(messageData);

    try {
        const jobStatus = await getJobStatus(jobId);

        switch (jobStatus) {
            case 'STOPPED':
                console.log(`Job ${jobId} is paused. Skipping processing.`);
                break;
            case 'CANCELLED':
                console.log(`Job ${jobId} is cancelled. Committing offset.`);
                await commitOffsetsWithRetry(consumer, topic, partition, message.offset, INSTANCE_ID);
                break;
            case 'RUNNING':
                await scraperPool.scrapeVehicle(startDate, endDate, country, vehicleId, jobId, topic, partition, message);
                break;
            default:
                console.warn(`Unknown job status: ${jobStatus} for job ${jobId}. Skipping processing.`);
        }
    } catch (error) {
        console.error(`Error processing message for vehicle ${vehicleId}:`, error);
        await handleFailedScrape({ getId: () => vehicleId }, error, jobId);
    }
}

async function getJobStatus(jobId) {
    const result = await db.query('SELECT status FROM job WHERE id = $1', [BigInt(jobId)]);
    return result.rows[0]?.status;
}

async function handleFailedScrape(vehicle, error, jobId) {
    console.error(`Scraping failed for vehicle ${vehicle.getId()}`);

    const dlqMessage = {
        vehicleId: vehicle.getId(),
        error: error ? (error.message || String(error)) : 'Unknown error',
        timestamp: new Date().toISOString(),
        instanceId: INSTANCE_ID,
        jobId
    };

    try {
        await sendToKafka(DLQ_TOPIC_DR_AVAILABILITY, dlqMessage, INSTANCE_ID);
        console.log(`Failed vehicle ${vehicle.getId()} sent to DLQ`);
    } catch (dlqError) {
        console.error(`Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
    }
}

async function handleSuccessfulScrape(data) {
    const { vehicleId, scraped } = data;
    try {
        await sendToKafka(SCRAPED_TOPIC_DR_AVAILABILITY, scraped, INSTANCE_ID);
        console.log(`Scraped data sent for vehicle ${vehicleId}`);
    } catch (error) {
        console.error(`Failed to send scraped data for vehicle ${vehicleId}:`, error);
    }
}

async function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`Shutting down gracefully...`);
    try {
        await consumer.disconnect();
        if (scraperPool) {
            await scraperPool.close();
        }
    } catch (error) {
        console.error(`Error during shutdown:`, error);
    }
    process.exit(0);
}

process.on('SIGTERM', cleanup);

process.on('unhandledRejection', (reason, promise) => {
    console.error(`Unhandled Rejection at:`, promise, 'reason:', reason);
});

module.exports = { startPricingConsumer };