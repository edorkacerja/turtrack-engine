'use strict';

const { Kafka } = require('kafkajs');
const {
    KAFKA_CLIENT_ID_PREFIX_SEARCH,
    KAFKA_CONSUMER_GROUP_ID_SEARCH,
    TO_BE_SCRAPED_CELLS_TOPIC, SCRAPED_CELLS_TOPIC, DLQ_CELLS_TOPIC
} = require("../utils/constants");
const JobService = require("../services/JobService");
const { logMemoryUsage } = require("../utils/utils");
const { sendToKafka, commitOffsetsWithRetry } = require("../utils/kafkaUtil");
const SearchScraperPool = require("../scrapers/SearchScraperPool");
const dateutil = require("../utils/dateutil");
const BaseCell = require("../models/BaseCell");
const OptimalCell = require("../models/OptimalCell");
const MetadataManager = require("../managers/MetadataManager");
const Vehicle = require("../models/Vehicle");
const FileManager = require("../managers/FileManager");

class CellsConsumer {
    constructor() {
        this.proxyAuth = process.env.PROXY_AUTH;
        this.proxyServer = process.env.PROXY_SERVER;
        this.MAX_POOL_SIZE = 10; // Optimal scrapers
        this.isShuttingDown = false;
        this.fileManager = new FileManager("search");
        this.totalMessagesReceived = 0;

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
            sessionTimeout: 600000,
            heartbeatInterval: 3000,
            retry: {
                initialRetryTime: 300,
                retries: 10
            },
            readUncommitted: true,
            autoCommit: false,
            maxBytesPerPartition: 3000
        });

        this.scraperPool = null;
    }

    async start() {
        while (true) {
            try {
                console.log(`Connecting to Kafka and subscribing to ${TO_BE_SCRAPED_CELLS_TOPIC}`);
                await this.consumer.connect();
                await this.consumer.subscribe({ topic: TO_BE_SCRAPED_CELLS_TOPIC, fromBeginning: true });

                console.log(`Initializing Search ScraperPool...`);
                this.scraperPool = new SearchScraperPool(
                    this.MAX_POOL_SIZE,
                    this.proxyAuth,
                    this.proxyServer,
                    this.handleFailedScrape.bind(this),
                    this.handleSuccessfulScrape.bind(this),
                    // this.pauseConsumer.bind(this),
                    // this.resumeConsumer.bind(this)
                );
                await this.scraperPool.initialize();

                await this.runKafkaConsumer();
                console.log(`Availability scraper consumer is now running and listening for messages`);
                logMemoryUsage();

                break;
            } catch (error) {
                console.error(`Consumer error, attempting to reconnect:`, error);
                await this.consumer.disconnect().catch(() => { });
                if (this.scraperPool) {
                    await this.scraperPool.close();
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async runKafkaConsumer() {
        // Dynamically import p-limit
        const pLimit = (await import('p-limit')).default;
        const limit = pLimit(this.MAX_POOL_SIZE); // Limit to 10 concurrent async tasks

        let activeTasksCount = 0;
        let totalTasksProcessed = 0;

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                this.totalMessagesReceived++;
                console.log(`Received message from ${topic}#${partition}`);
                console.log(`Total messages received: ${this.totalMessagesReceived}`);


                limit(async () => {
                    activeTasksCount++;

                    console.log(`Starting limited task. Active tasks: ${activeTasksCount}`);
                    const jobId = this.extractJobId(message);
                    const isJobRunning = await JobService.isJobRunning(jobId);

                    if (isJobRunning) {
                        await this.scraperPool.handleMessage(topic, partition, message, this.consumer);
                    } else {
                        console.log(`Job ${jobId} is not running. Skipping message.`);
                        await commitOffsetsWithRetry(this.consumer, topic, partition, message.offset);
                    }

                    activeTasksCount--;
                    totalTasksProcessed++;
                    console.log(`Task completed. Active tasks: ${activeTasksCount}, Total processed: ${totalTasksProcessed}`);
                }).catch(error => {
                    console.error('Error in limited task:', error);
                    activeTasksCount--;
                });
            },
        });
    }

    extractJobId(message) {
        try {
            const messageValue = JSON.parse(message.value.toString());
            return messageValue.jobId;
        } catch (error) {
            console.error('Error extracting jobId from message:', error);
            return null;
        }
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

            let { baseCell, optimalCell, scraped } = data;

            optimalCell.setSearchLastUpdated(dateutil.now());
            baseCell.setSearchLastUpdated(dateutil.now());

            baseCell = new BaseCell(baseCell);
            optimalCell = new OptimalCell(optimalCell);

            MetadataManager.addOptimalCell(optimalCell);
            MetadataManager.addBaseCell(baseCell);

            const vehicles = scraped.vehicles;

            for (let vehicle of vehicles) {
                const vehicleObj = new Vehicle()
                    .setId(vehicle.id)
                    .setCountry(baseCell.country)
                    .setCellId(optimalCell.getId())
                    .setSearchLastUpdated(dateutil.now());

                console.log(`Adding vehicle ${vehicle.id} to metadata.`);
                await MetadataManager.addVehicle(vehicleObj);
            }

            await MetadataManager.updateHash();
            await this.fileManager.write(optimalCell.getId(), scraped);

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