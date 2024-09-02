const PricingScraper = require('./PricingScraper');
const { commitOffsetsWithRetry } = require('../utils/kafkaUtil');

class ScraperPool {
    constructor(poolSize = 20, config) {
        this.poolSize = poolSize;
        this.config = config;
        this.scrapers = [];
        this.availableScrapers = [];
        this.consumer = config.consumer;
        this.processingPromises = new Set();
    }

    async initialize() {
        for (let i = 0; i < this.poolSize; i++) {
            const scraper = new PricingScraper({...this.config, instanceId: `Pricing-Scraper-${i}`});
            await scraper.init();
            this.scrapers.push(scraper);
            this.availableScrapers.push(scraper);
        }
        console.log(`Initialized pool of ${this.poolSize} scrapers`);

        await this.setupKafkaConsumer();
    }

    async setupKafkaConsumer() {
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await this.handleMessage(topic, partition, message);
            },
        });
    }

    async handleMessage(topic, partition, message) {
        if (this.availableScrapers.length === 0) {
            // Wait for a scraper to become available
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.availableScrapers.length > 0) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }

        const scraper = this.availableScrapers.pop();
        const messageData = JSON.parse(message.value.toString());
        const { startDate, endDate, country, vehicleId, jobId } = messageData;

        const processingPromise = this.scrapeVehicle(scraper, startDate, endDate, country, vehicleId, jobId)
            .then(async (result) => {
                if (result.success) {
                    await this.config.handleSuccessfulScrape(result);
                    await commitOffsetsWithRetry(this.consumer, topic, partition, message.offset, this.config.instanceId);
                } else {
                    await this.config.handleFailedScrape({ getId: () => vehicleId }, result.error, jobId);
                }
            })
            .catch(async (error) => {
                console.error(`Error processing vehicle ${vehicleId}:`, error);
                await this.config.handleFailedScrape({ getId: () => vehicleId }, error, jobId);
            })
            .finally(() => {
                this.availableScrapers.push(scraper);
                this.processingPromises.delete(processingPromise);
            });

        this.processingPromises.add(processingPromise);
    }

    async scrapeVehicle(scraper, startDate, endDate, country, vehicleId, jobId) {
        const vehicle = { getId: () => vehicleId };
        return scraper.scrape(vehicle, jobId, startDate, endDate);
    }

    async close() {
        await Promise.all(Array.from(this.processingPromises));
        for (const scraper of this.scrapers) {
            await scraper.close();
        }
    }
}

module.exports = ScraperPool;