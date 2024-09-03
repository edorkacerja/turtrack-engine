const PricingScraper = require('./PricingScraper');
const {commitOffsetsWithRetry} = require("../utils/kafkaUtil");
const {sleep} = require("../utils/utils");

class ScraperPool {
    constructor(poolSize = 20,
                proxyAuth,
                proxyServer,
                consumer,
                handleFailedScrape,
                handleSuccessfulScrape) {
        this.poolSize = poolSize;
        this.proxyAuth = proxyAuth;
        this.proxyServer = proxyServer;
        this.consumer = consumer;
        this.handleFailedScrape = handleFailedScrape;
        this.handleSuccessfulScrape = handleSuccessfulScrape;

        this.scrapers = [];
        this.availableScrapers = [];
        this.processingPromises = new Set();
    }

    async initialize() {
        for (let i = 0; i < this.poolSize; i++) {
            await this.createScraper(i);
        }
        console.log(`Initialized pool of ${this.poolSize} scrapers`);

        await this.runKafkaConsumer();
    }

    async createScraper(index) {
        const scraper = new PricingScraper({
            proxyAuth: this.proxyAuth,
            proxyServer: this.proxyServer,
            instanceId: `Pricing-Scraper-${index}`
        });

        await scraper.init();
        this.scrapers.push(scraper);
        this.availableScrapers.push(scraper);
    }

    async runKafkaConsumer() {
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

        const processingPromise = this.scrapeVehicleWithRetry(scraper, startDate, endDate, country, vehicleId, jobId)
            .then(async (result) => {
                    await this.handleSuccessfulScrape(result);
            })
            .catch(async (error) => {
                console.error(`Error processing vehicle ${vehicleId}:`, error);

                await this.handleFailedScrape({ getId: () => vehicleId }, error, jobId);
            })
            .finally(() => {
                commitOffsetsWithRetry(this.consumer, topic, partition, message.offset);
                this.availableScrapers.push(scraper);
                this.processingPromises.delete(processingPromise);
            });

        this.processingPromises.add(processingPromise);
    }

    async scrapeVehicleWithRetry(scraper, startDate, endDate, country, vehicleId, jobId, retryCount = 0) {
        const vehicle = { getId: () => vehicleId };
        try {
            const result = await scraper.scrape(vehicle, jobId, startDate, endDate);
            if (result[0].success) {
                return result[0];
            } else {
                throw new Error(`[${scraper.instanceId}] Something went wrong with scraping`);
            }
        } catch (error) {
            if (retryCount < 2) {  // Allow up to 3 attempts (initial + 2 retries)
                console.log(`[${scraper.instanceId}] Attempt ${retryCount + 1} failed for vehicle ${vehicleId}. Retrying...`);

                // Destroy the current scraper instance
                await scraper.destroy();
                const index = this.scrapers.indexOf(scraper);
                this.scrapers.splice(index, 1);

                // Delay 3 sec
                await sleep(3000);

                // Create a new scraper instance
                await this.createScraper(index);
                const newScraper = this.availableScrapers.pop();

                // Retry with the new scraper
                return this.scrapeVehicleWithRetry(newScraper, startDate, endDate, country, vehicleId, jobId, retryCount + 1);
            } else {
                console.log(`[${scraper.instanceId}] All retry attempts failed for vehicle ${vehicleId}.`);
                return { success: false, error };
            }
        }
    }

    async close() {
        await Promise.all(Array.from(this.processingPromises));
        for (const scraper of this.scrapers) {
            await scraper.close();
        }
    }
}

module.exports = ScraperPool;