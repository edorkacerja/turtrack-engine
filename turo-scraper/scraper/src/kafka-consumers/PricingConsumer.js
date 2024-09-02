'use strict';

const { Kafka } = require('kafkajs');
const PricingScraper = require('../scrapers/PricingScraper');
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
const proxyServer= process.env.PROXY_SERVER;

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

let pricingScraper;
let consecutiveFailures = 0;

async function initializeScraper(startDate, endDate, country) {
    if (!pricingScraper) {
        pricingScraper = new PricingScraper({ proxyAuth, proxyServer, startDate, endDate, country, instanceId: INSTANCE_ID });
        await pricingScraper.init();
        await pricingScraper.onSuccess(handleSuccess);
        await pricingScraper.onFailed(handleFailed);
        await pricingScraper.onFinish(handleFinish);
        console.log(`Availability Scraper initialized`);
    }
    return pricingScraper;
}

async function handleScraperFailure() {
    consecutiveFailures++;
    console.warn(`Consecutive failures: ${consecutiveFailures}. Recreating browser instance.`);
    await pricingScraper.recreateBrowserInstance();
}

async function processMessage(messageData, topic, partition, message) {
    const { startDate, endDate, country, vehicleId, jobId } = messageData;

    console.log(`Consumed vehicle with id ${vehicleId} for availability scraping`);
    console.log(messageData);

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
            await scrapeVehicle(startDate, endDate, country, vehicleId, jobId, topic, partition, message);
            break;
        default:
            console.warn(`Unknown job status: ${jobStatus} for job ${jobId}. Skipping processing.`);
    }
}

async function getJobStatus(jobId) {
    const result = await db.query('SELECT status FROM job WHERE id = $1', [BigInt(jobId)]);
    return result.rows[0]?.status;
}

async function scrapeVehicle(startDate, endDate, country, vehicleId, jobId, topic, partition, message) {
    try {
        const scraper = await initializeScraper(startDate, endDate, country);
        const vehicle = { getId: () => vehicleId };
        const results = await scraper.scrape([vehicle], jobId);

        if (results[0].success) {
            await commitOffsetsWithRetry(consumer, topic, partition, message.offset, INSTANCE_ID);
            console.log(`Successfully processed vehicle ${vehicleId}`);
            consecutiveFailures = 0;
        } else {
            console.error(`Failed to scrape vehicle ${vehicleId}: ${results[0].error}`);
            await handleScraperFailure();
        }
    } catch (error) {
        console.error(`Error processing vehicle ${vehicleId}:`, error);
        await handleScraperFailure();
    }
}


// ------------------------------------------------ SCRAPER CALLBACKS --------------------------------------------------

async function handleSuccess(data) {
    const { vehicle, scraped } = data;
    try {
        await sendToKafka(SCRAPED_TOPIC_DR_AVAILABILITY, scraped, INSTANCE_ID);
        console.log(`Scraped data sent for vehicle ${vehicle.getId()}`);
    } catch (error) {
        console.error(`Failed to send scraped data for vehicle ${vehicle.getId()}:`, error);
    }
}

async function handleFailed(data) {
    const { vehicle, error } = data;
    console.error(`Scraping failed for vehicle ${vehicle.getId()}`);

    const dlqMessage = {
        vehicleId: vehicle.getId(),
        error: error ? (error.message || String(error)) : 'Unknown error',
        timestamp: new Date().toISOString(),
        instanceId: INSTANCE_ID
    };

    try {
        await sendToKafka(DLQ_TOPIC_DR_AVAILABILITY, dlqMessage, INSTANCE_ID);
        console.log(`Failed vehicle ${vehicle.getId()} sent to DLQ`);
    } catch (dlqError) {
        console.error(`Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
    }
}

function handleFinish(results) {
    console.log(`Finished processing ${results.length} vehicle(s)`);
}

// ------------------------------------------------ CONSUMER LIFECYCLE -------------------------------------------------

async function startPricingConsumer() {
    while (true) {
        try {
            console.log(`Connecting to Kafka and subscribing to ${TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_}`);
            await consumer.connect();
            await consumer.subscribe({ topic: TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_ });

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
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

let isShuttingDown = false;

process.on('SIGTERM', async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`SIGTERM received. Shutting down gracefully...`);
    try {
        await consumer.disconnect();
        if (pricingScraper) {
            await pricingScraper.close();
        }
    } catch (error) {
        console.error(`Error during shutdown:`, error);
    }
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`Unhandled Rejection at:`, promise, 'reason:', reason);
});

module.exports = { startPricingConsumer };