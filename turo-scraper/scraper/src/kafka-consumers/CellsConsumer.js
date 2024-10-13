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
        this.totalMessagesReceived = 0;

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
                await this.scraperPool.initialize();

                await this.runRabbitMQConsumer();
                console.log(`Availability scraper consumer is now running and listening for messages`);
                logMemoryUsage();

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

            this.totalMessagesReceived++;
            console.log(`Received message from ${TO_BE_SCRAPED_CELLS_QUEUE}`);
            console.log(`Total messages received: ${this.totalMessagesReceived}`);

            const jobId = this.extractJobId(message);
            const isJobRunning = await JobService.isJobRunning(jobId);

            if (isJobRunning) {
                console.log(`Processing message for job ${jobId}`);
                await this.processMessage(message);
            } else {
                console.log(`Job ${jobId} is not running. Skipping message.`);
                this.channel.ack(message);
            }
        }, { noAck: false });
    }

    async processMessage(message) {
        try {
            await this.scraperPool.handleMessage(message, this.channel);
            console.log(`Finished processing message`);
        } catch (error) {
            console.error(`Error processing message:`, error);
            // Handle the error (e.g., send to DLQ, retry, etc.)
            await this.handleFailedScrape(null, error, this.extractJobId(message), message);
        }
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

        this.channel.ack(message);

        try {
            await this.channel.sendToQueue(DLQ_CELLS_QUEUE, Buffer.from(JSON.stringify(dlqMessage)));
            console.log(`Failed cell ${cell ? cell.getId() : 'unknown'} sent to DLQ`);
        } catch (dlqError) {
            console.error(`Failed to send to DLQ for cell ${cell ? cell.getId() : 'unknown'}:`, dlqError);
        }
    }

    async handleSuccessfulScrape(data) {
        try {
            await this.channel.sendToQueue(SCRAPED_CELLS_QUEUE, Buffer.from(JSON.stringify(data)));
            console.log(`Scraped data sent for cell ${data.baseCell.getId()}`);

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
            console.error(`Failed to send scraped data for cell ${data.baseCell.getId()}:`, error);
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
            logMemoryUsage();
            process.exit(0);
        }
    }
}

module.exports = CellsConsumer;