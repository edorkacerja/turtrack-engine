const { Kafka } = require('kafkajs');
const PricingScraper = require('../scrapers/PricingScraper');
const { sendToKafka, commitOffsetsWithRetry } = require('../utils/kafkaUtil');
const os = require('os');
const db = require("../config/db");

const instanceId = os.hostname();

const kafka = new Kafka({
    clientId: `availability-scraper-client-${instanceId}`,
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const consumer = kafka.consumer({
    groupId: 'availability-scraper-group',
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
const MAX_CONSECUTIVE_FAILURES = 5;

async function initializeScraper(startDate, endDate, country) {
    if (!pricingScraper) {
        pricingScraper = new PricingScraper({
            startDate,
            endDate,
            country,
            instanceId
        });
        await pricingScraper.init();
        pricingScraper.onSuccess(handleSuccess);
        pricingScraper.onFailed(handleFailed);
        pricingScraper.onFinish(handleFinish);
        console.log(`[Instance ${instanceId}] Availability Scraper initialized`);
    }
    return pricingScraper;
}

async function handleScraperFailure(startDate, endDate, country) {
    consecutiveFailures++;
    console.log(`[Instance ${instanceId}] Consecutive failures: ${consecutiveFailures}`);

    // if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        // console.log(`[Instance ${instanceId}] Max consecutive failures (${MAX_CONSECUTIVE_FAILURES}) reached. Recreating browser instance.`);
        await pricingScraper.recreateBrowserInstance();
        // consecutiveFailures = 0;
    // } else {
    //     console.log(`[Instance ${instanceId}] Recreating browser instance.`);
    //     await pricingScraper.recreateBrowserInstance();
    // }
}

async function handleMessage(messageData, topic, partition, message) {
    const { startDate, endDate, country, vehicleId, jobId } = messageData;
    console.log(`[Instance ${instanceId}] Consumed vehicle with id ${vehicleId} for availability scraping`);

    console.log(messageData);

    // Check job status in the db
    const result = await db.query('SELECT status FROM job WHERE id = $1', [BigInt(jobId)]);
    const jobStatus = result.rows[0]?.status;

    console.log(`Job ID: ${jobId}. Job Status: ${jobStatus}`);

    switch (jobStatus) {
        case 'STOPPED':
            console.log(`[Instance ${instanceId}] Job ${jobId} is paused. Putting scraper on hold.`);
            // Don't commit the message, allowing it to be reprocessed later
            return;

        case 'CANCELLED':
            console.log(`[Instance ${instanceId}] Job ${jobId} is cancelled. Committing offset to remove from queue.`);
            await commitOffsetsWithRetry(consumer, topic, partition, message.offset, instanceId);
            return;

        case 'RUNNING':
            try {
                const scraper = await initializeScraper(startDate, endDate, country);
                const vehicle = { getId: () => vehicleId };
                const results = await scraper.scrape([vehicle], jobId);

                if (results[0].success) {
                    await commitOffsetsWithRetry(consumer, topic, partition, message.offset, instanceId);
                    console.log(`[Instance ${instanceId}] Successfully processed and committed offset for vehicle ${vehicleId}`);
                    consecutiveFailures = 0;
                } else {
                    console.log(`[Instance ${instanceId}] Failed to scrape vehicle ${vehicleId}: ${results[0].error}`);
                    await handleScraperFailure(startDate, endDate, country);
                }
            } catch (error) {
                console.error(`[Instance ${instanceId}] Error processing vehicle ${vehicleId}:`, error);
                await handleScraperFailure(startDate, endDate, country);
            }
            break;

        default:
            console.log(`[Instance ${instanceId}] Unknown job status: ${jobStatus}. Skipping processing.`);
            // Optionally, you might want to commit the offset here to avoid reprocessing messages with unknown statuses
            // await commitOffsetsWithRetry(consumer, topic, partition, message.offset, instanceId);
            break;
    }
}
async function handleSuccess(data) {
    const { vehicle, scraped, jobId } = data;
    console.log(`[Instance ${instanceId}] Successfully scraped availability for vehicle ${vehicle.getId()}`);
    try {
        await sendToKafka('SCRAPED-dr-availability-topic', scraped, instanceId);
        console.log(`[Instance ${instanceId}] Sent scraped data for vehicle ${vehicle.getId()} to SCRAPED-dr-availability-topic`);
    } catch (error) {
        console.error(`[Instance ${instanceId}] Failed to send scraped data to Kafka for vehicle ${vehicle.getId()}:`, error);
    }
}

async function handleFailed(data) {
    const { vehicle, error } = data;
    console.log(`[Instance ${instanceId}] Failed to scrape availability for vehicle ${vehicle.getId()}`);

    const dlqMessage = {
        vehicleId: vehicle.getId(),
        error: error ? (error.message || String(error)) : 'Unknown error',
        timestamp: new Date().toISOString(),
        instanceId: instanceId
    };

    try {
        await sendToKafka('DLQ-dr-availability-topic', dlqMessage, instanceId);
        console.log(`[Instance ${instanceId}] Sent failed vehicle ${vehicle.getId()} to DLQ`);
    } catch (dlqError) {
        console.error(`[Instance ${instanceId}] Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
    }
}


function handleFinish(results) {
    console.log(`[Instance ${instanceId}] Finished processing vehicle(s):`, results);
}

async function startPricingConsumer() {
    while (true) {
        try {

            console.log(`KAFKA_BOOTSTRAP_SERVERS: ${process.env.KAFKA_BOOTSTRAP_SERVERS}. Attempting to connect to TO-BE-SCRAPED-dr-availability-topic`)
            await consumer.connect();
            await consumer.subscribe({ topic: 'TO-BE-SCRAPED-dr-availability-topic'});

            await consumer.run({
                autoCommit: false,
                eachMessage: async ({ topic, partition, message }) => {
                    const messageData = JSON.parse(message.value.toString());
                    await handleMessage(messageData, topic, partition, message);
                },
            });

            console.log(`[Instance ${instanceId}] Availability scraper consumer is now running and listening for messages...`);

            // If we reach here, it means the consumer has stopped. We should break the loop to fully disconnect.
            break;
        } catch (error) {
            console.error(`[Instance ${instanceId}] Consumer error, attempting to reconnect:`, error);
            await consumer.disconnect().catch(() => {}); // Ensure we're fully disconnected
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}


let isShuttingDown = false;

process.on('SIGTERM', async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`[Instance ${instanceId}] SIGTERM received. Shutting down gracefully...`);
    try {
        await consumer.disconnect();
        if (pricingScraper) {
            await pricingScraper.close();
        }
    } catch (error) {
        console.error(`[Instance ${instanceId}] Error during shutdown:`, error);
    }
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[Instance ${instanceId}] Unhandled Rejection at:`, promise, 'reason:', reason);
});

module.exports = { startPricingConsumer };