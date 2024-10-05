'use strict';

const { Kafka } = require('kafkajs');
const {
    KAFKA_CLIENT_ID_PREFIX_SEARCH,
    KAFKA_CONSUMER_GROUP_ID_SEARCH,
    TO_BE_SCRAPED_CELLS_TOPIC, SCRAPED_CELLS_TOPIC, DLQ_TOPIC_DR_AVAILABILITY, DLQ_CELLS_TOPIC
} = require("../utils/constants");
const { logMemoryUsage } = require("../utils/utils");
const { sendToKafka, commitOffsetsWithRetry} = require("../utils/kafkaUtil");
const SearchScraperPool = require("../scrapers/SearchScraperPool");

class CellsConsumer {
    constructor() {
        this.proxyAuth = process.env.PROXY_AUTH;
        this.proxyServer = process.env.PROXY_SERVER;
        this.MAX_POOL_SIZE = 20;
        this.isShuttingDown = false;

        this.kafka = new Kafka({
            clientId: `${KAFKA_CLIENT_ID_PREFIX_SEARCH}`,
            brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
            retry: {
                initialRetryTime: 100,
                retries: 8
            }
        });

        this.consumer = this.kafka.consumer({
            groupId: KAFKA_CONSUMER_GROUP_ID_SEARCH,
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
                console.log(`Connecting to Kafka and subscribing to ${TO_BE_SCRAPED_CELLS_TOPIC}`);
                await this.consumer.connect();
                await this.consumer.subscribe({ topic: TO_BE_SCRAPED_CELLS_TOPIC });

                console.log(`Initializing Search ScraperPool...`);
                this.scraperPool = new SearchScraperPool(
                    this.MAX_POOL_SIZE,
                    this.proxyAuth,
                    this.proxyServer,
                    this.handleFailedScrape.bind(this),
                    this.handleSuccessfulScrape.bind(this),
                    this.pauseConsumer.bind(this),
                    this.resumeConsumer.bind(this)
                );
                await this.scraperPool.initialize();
                await this.runKafkaConsumer();

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

    async runKafkaConsumer() {
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await this.scraperPool.handleMessage(topic, partition, message, this.consumer);
            },
        });
    }

    async pauseConsumer() {
        await this.consumer.pause([{ topic: TO_BE_SCRAPED_CELLS_TOPIC }]);
        console.log('Consumer paused');
    }

    async resumeConsumer() {
        await this.consumer.resume([{ topic: TO_BE_SCRAPED_CELLS_TOPIC }]);
        console.log('Consumer resumed');
    }

    async handleFailedScrape(cell, error, jobId, topic, partition, message) {
        console.error(`Scraping failed for cell ${cell.getId()}`);

        const dlqMessage = {
            cellId: cell.getId(),
            error: error ? (error.message || String(error)) : 'Unknown error',
            timestamp: new Date().toISOString(),
            jobId
        };

        await commitOffsetsWithRetry(this.consumer, topic, partition, message.offset);

        try {
            await sendToKafka(DLQ_CELLS_TOPIC, dlqMessage);
            console.log(`Failed cell ${cell.getId()} sent to DLQ`);
        } catch (dlqError) {
            console.error(`Failed to send to DLQ for cell ${cell.getId()}:`, dlqError);
        }
    }

    async handleSuccessfulScrape(data) {
        try {
            await sendToKafka(SCRAPED_CELLS_TOPIC, data);
            console.log(`Scraped data sent for cell ${data}`);
        } catch (error) {
            console.error(`Failed to send scraped data for vehicle ${data}:`, error);
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

module.exports = CellsConsumer;