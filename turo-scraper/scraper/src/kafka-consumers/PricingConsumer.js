'use strict';

const { Kafka } = require('kafkajs');
const {
    KAFKA_CLIENT_ID_PREFIX_DR_AVAILABILITY,
    KAFKA_CONSUMER_GROUP_ID_DR_AVAILABILITY,
    TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_,
    DLQ_TOPIC_DR_AVAILABILITY,
    SCRAPED_TOPIC_DR_AVAILABILITY
} = require("../utils/constants");
const { logMemoryUsage } = require("../utils/utils");
const { sendToKafka } = require("../utils/kafkaUtil");
const ScraperPool = require("../scrapers/ScraperPool");

class PricingConsumer {
    constructor() {
        this.proxyAuth = process.env.PROXY_AUTH;
        this.proxyServer = process.env.PROXY_SERVER;
        this.MAX_POOL_SIZE = 3;
        this.isShuttingDown = false;

        this.kafka = new Kafka({
            clientId: `${KAFKA_CLIENT_ID_PREFIX_DR_AVAILABILITY}`,
            brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });

        this.consumer = this.kafka.consumer({
            groupId: KAFKA_CONSUMER_GROUP_ID_DR_AVAILABILITY,
            maxInFlightRequests: 1,
            sessionTimeout: 60000,
            heartbeatInterval: 3000,
            retry: {
                initialRetryTime: 300,
                retries: 10
            },
            readUncommitted: true,
            autoCommit: false
        });

        this.scraperPool = null;
    }

    async start() {
        while (true) {
            try {
                console.log(`Connecting to Kafka and subscribing to ${TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_}`);
                await this.consumer.connect();
                await this.consumer.subscribe({ topic: TO_BE_SCRAPED_TOPIC_DR_AVAILABILITY_ });

                console.log(`Initializing ScraperPool...`);
                this.scraperPool = new ScraperPool(
                    this.MAX_POOL_SIZE,
                    this.proxyAuth,
                    this.proxyServer,
                    this.consumer,
                    this.handleFailedScrape.bind(this),
                    this.handleSuccessfulScrape.bind(this)
                );
                await this.scraperPool.initialize();

                console.log(`Availability scraper consumer is now running and listening for messages`);
                logMemoryUsage();


                break;
            } catch (error) {
                console.error(`Consumer error, attempting to reconnect:`, error);
                await this.consumer.disconnect().catch(() => {});
                if (this.scraperPool) {
                    await this.scraperPool.close();
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async handleFailedScrape(vehicle, error, jobId) {
        console.error(`Scraping failed for vehicle ${vehicle.getId()}`);

        const dlqMessage = {
            vehicleId: vehicle.getId(),
            error: error ? (error.message || String(error)) : 'Unknown error',
            timestamp: new Date().toISOString(),
            jobId
        };

        try {
            await sendToKafka(DLQ_TOPIC_DR_AVAILABILITY, dlqMessage);
            console.log(`Failed vehicle ${vehicle.getId()} sent to DLQ`);
        } catch (dlqError) {
            console.error(`Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
        }
    }

    async handleSuccessfulScrape(data) {
        const { vehicleId, scraped } = data;
        try {
            await sendToKafka(SCRAPED_TOPIC_DR_AVAILABILITY, scraped);
            console.log(`Scraped data sent for vehicle ${vehicleId}`);
        } catch (error) {
            console.error(`Failed to send scraped data for vehicle ${vehicleId}:`, error);
        }
    }

    async cleanup() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log(`Shutting down gracefully...`);
        try {
            await this.consumer.disconnect();
            if (this.scraperPool) {
                await this.scraperPool.close();
            }
        } catch (error) {
            console.error(`Error during shutdown:`, error);
        } finally {
            logMemoryUsage();
            process.exit(0);
        }
    }
}

module.exports = PricingConsumer;