'use strict';

const amqp = require('amqplib');
const {
    TO_BE_SCRAPED_CELLS_QUEUE,
    SCRAPED_CELLS_QUEUE,
    DLQ_CELLS_QUEUE
} = require("../utils/constants");
const JobService = require("../services/JobService");
const { logMemoryUsage } = require("../utils/utils");
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
        this.MAX_POOL_SIZE = 10;
        this.isShuttingDown = false;
        this.fileManager = new FileManager("search");

        this.connection = null;
        this.channel = null;
        this.scraperPool = null;
    }

    async start() {
        while (true) {
            try {
                console.log(`Connecting to RabbitMQ and subscribing to ${TO_BE_SCRAPED_CELLS_QUEUE}`);
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);
                this.channel = await this.connection.createChannel();

                await this.channel.assertQueue(TO_BE_SCRAPED_CELLS_QUEUE, { durable: true });
                await this.channel.assertQueue(SCRAPED_CELLS_QUEUE, { durable: true });
                await this.channel.assertQueue(DLQ_CELLS_QUEUE, { durable: true });

                // Set the prefetch count to control concurrency
                await this.channel.prefetch(this.MAX_POOL_SIZE);

                console.log(`Initializing Search ScraperPool...`);
                this.scraperPool = new SearchScraperPool(
                    this.MAX_POOL_SIZE,
                    this.proxyAuth,
                    this.proxyServer,
                    this.handleFailedScrape.bind(this),
                    this.handleSuccessfulScrape.bind(this)
                );

                await this.runRabbitMQConsumer();
                console.log(`Search Consumer is now running and listening for messages from the queue`);

                break;
            } catch (error) {
                console.error(`Consumer error, attempting to reconnect:`, error);
                if (this.channel) await this.channel.close().catch(() => {});
                if (this.connection) await this.connection.close().catch(() => {});
                if (this.scraperPool) await this.scraperPool.close();
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async runRabbitMQConsumer() {
        await this.channel.consume(TO_BE_SCRAPED_CELLS_QUEUE, async (message) => {
            if (message === null) {
                console.log('Consumer cancelled by server');
                return;
            }

            const jobId = this.extractJobId(message);
            const isJobRunning = await JobService.isJobRunning(jobId);
            console.log(`Received message from ${TO_BE_SCRAPED_CELLS_QUEUE} JobID: ${jobId}`);

            if (!isJobRunning) {
                console.log(`Job ${jobId} is not running. Acknowledging message.`);
                this.channel.ack(message);
                return;
            }

            try {
                await this.scraperPool.handleMessage(message, this.channel);
                console.log(`Finished processing message for job ${jobId}`);
            } catch (error) {
                console.error(`Error processing message for job ${jobId}:`, error);
            } finally {
                this.channel.ack(message);
            }
            }, { noAck: false });
    }

    extractJobId(message) {
        try {
            const messageContent = JSON.parse(message.content.toString());
            return messageContent.jobId;
        } catch (error) {
            console.error('Error extracting jobId from message:', error);
            return null;
        }
    }

    async handleFailedScrape(cell, error, jobId, message) {
        console.error(`Scraping failed for cell ${cell ? cell.getId() : 'unknown'}`);

        const dlqMessage = {
            cellId: cell ? cell.getId() : 'unknown',
            error: error ? (error.message || String(error)) : 'Unknown error',
            timestamp: new Date().toISOString(),
            jobId
        };

        try {
            await this.channel.sendToQueue(DLQ_CELLS_QUEUE, Buffer.from(JSON.stringify(dlqMessage)));
            console.log(`Failed cell ${cell ? cell.getId() : 'unknown'} sent to DLQ`);
        } catch (dlqError) {
            console.error(`Failed to send to DLQ for cell ${cell ? cell.getId() : 'unknown'}:`, dlqError);
        }
    }

    async handleSuccessfulScrape(data) {
        try {
            let { baseCell, optimalCell, scraped } = data;
            const now = dateutil.now();

            // Update cells
            optimalCell.setSearchLastUpdated(now);
            baseCell.setSearchLastUpdated(now);

            baseCell = new BaseCell(baseCell);
            optimalCell = new OptimalCell(optimalCell);

            MetadataManager.addOptimalCell(optimalCell);
            MetadataManager.addBaseCell(baseCell);

            // Prepare data to send to queue
            const queueData = {
                ...data,
                scraped: {
                    vehicles: []
                }
            };

            // Check if there are any vehicles
            if (scraped.vehicles && scraped.vehicles.length > 0) {
                for (let vehicle of scraped.vehicles) {
                    const vehicleObj = new Vehicle()
                        .setId(vehicle.id)
                        .setCountry(baseCell.country)
                        .setCellId(optimalCell.getId())
                        .setSearchLastUpdated(now);

                    // Add simplified vehicle data to queue data
                    queueData.scraped.vehicles.push({
                        id: vehicle.id,
                        country: baseCell.country,
                        cellId: optimalCell.getId(),
                        searchLastUpdated: now
                    });

                    console.log(`Adding vehicle ${vehicle.id} to metadata.`);
                    await MetadataManager.addVehicle(vehicleObj);
                }
            }

            // Send data to queue
            await this.channel.sendToQueue(SCRAPED_CELLS_QUEUE, Buffer.from(JSON.stringify(queueData)));
            console.log(`Scraped data sent for cell ${baseCell.getId()}`);

            await MetadataManager.updateHash();
            await this.fileManager.write(optimalCell.getId(), scraped);

        } catch (error) {
            console.error(`Failed to handle scraped data for cell ${data.baseCell.getId()}:`, error);
        }

    }
    async cleanup() {
        if (this.isShuttingDown) return;
        this.isShuttingDown = true;

        console.log(`Shutting down gracefully...`);
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            if (this.scraperPool) await this.scraperPool.close();
        } catch (error) {
            console.error(`Error during shutdown:`, error);
        } finally {
            process.exit(0);
        }
    }
}

module.exports = CellsConsumer;
