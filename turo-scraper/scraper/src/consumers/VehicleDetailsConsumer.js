'use strict';

const amqp = require('amqplib');
const {
    TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE,
    SCRAPED_VEHICLE_DETAILS_QUEUE,
    DLQ_VEHICLE_DETAILS_QUEUE
} = require("../utils/constants");
const { logMemoryUsage } = require("../utils/utils");
const JobService = require("../services/JobService");
const ScraperPool = require("../scrapers/VehicleDetailsScraperPool");

class VehicleDetailsConsumer {
    constructor() {
        this.proxyAuth = process.env.PROXY_AUTH;
        this.proxyServer = process.env.PROXY_SERVER;
        this.MAX_POOL_SIZE = 30;
        this.isShuttingDown = false;

        this.connection = null;
        this.channel = null;
        this.scraperPool = null;
    }

    async start() {
        while (true) {
            try {
                console.log(`Connecting to RabbitMQ and subscribing to ${TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE}`);
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);
                this.channel = await this.connection.createChannel();

                await this.channel.assertQueue(TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE, { durable: true });
                await this.channel.assertQueue(SCRAPED_VEHICLE_DETAILS_QUEUE, { durable: true });
                await this.channel.assertQueue(DLQ_VEHICLE_DETAILS_QUEUE, { durable: true });

                await this.channel.prefetch(this.MAX_POOL_SIZE);

                console.log(`Initializing Vehicle Details ScraperPool...`);
                this.scraperPool = new ScraperPool(
                    this.MAX_POOL_SIZE,
                    this.proxyAuth,
                    this.proxyServer,
                    this.handleFailedScrape.bind(this),
                    this.handleSuccessfulScrape.bind(this)
                );

                await this.runRabbitMQConsumer();
                console.log(`Vehicle Details Consumer is now running and listening for messages from the queue`);
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
        await this.channel.consume(TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE, async (message) => {
            if (message === null) {
                console.log('Consumer cancelled by server');
                return;
            }

            const messageData = JSON.parse(message.content.toString());
            const { vehicleId, startDate, endDate, startTime, endTime, jobId } = messageData;
            console.log(`Received message from ${TO_BE_SCRAPED_VEHICLE_DETAILS_QUEUE} JobID: ${jobId}`);

            try {
                const isJobRunning = await JobService.isJobRunning(jobId);
                if (!isJobRunning) {
                    console.log(`Job ${jobId} is no longer running. Acknowledging message.`);
                    this.channel.ack(message);
                    return;
                }

                await this.scraperPool.handleMessage(messageData, this.channel);
                console.log(`Finished processing message for job ${jobId}`);
            } catch (error) {
                console.error(`Error processing message for job ${jobId}:`, error);
                await this.handleFailedScrape({ id: vehicleId }, error, jobId);
            } finally {
                this.channel.ack(message);
            }
        }, { noAck: false });
    }

    async handleFailedScrape(vehicle, error, jobId) {
        console.error(`Scraping failed for vehicle ${vehicle.id}`);

        const dlqMessage = {
            vehicleId: vehicle.id,
            error: error ? (error.message || String(error)) : 'Unknown error',
            timestamp: new Date().toISOString(),
            jobId
        };

        try {
            await this.channel.sendToQueue(DLQ_VEHICLE_DETAILS_QUEUE, Buffer.from(JSON.stringify(dlqMessage)));
            console.log(`Failed vehicle ${vehicle.id} sent to DLQ`);
        } catch (dlqError) {
            console.error(`Failed to send to DLQ for vehicle ${vehicle.id}:`, dlqError);
        }
    }

    async handleSuccessfulScrape(data) {
        const { vehicleId, scraped } = data;
        try {
            await this.channel.sendToQueue(SCRAPED_VEHICLE_DETAILS_QUEUE, Buffer.from(JSON.stringify(data)));
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

module.exports = VehicleDetailsConsumer;