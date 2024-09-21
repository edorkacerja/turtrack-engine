const PricingScraper = require('./PricingScraper');
const { commitOffsetsWithRetry } = require("../utils/kafkaUtil");
const { sleep, logMemoryUsage } = require("../utils/utils");

class PricingScraperPool {
    constructor(maxPoolSize = 60,
                proxyAuth,
                proxyServer,
                consumer,
                handleFailedScrape,
                handleSuccessfulScrape) {
        this.maxPoolSize = maxPoolSize;
        this.proxyAuth = proxyAuth;
        this.proxyServer = proxyServer;
        this.consumer = consumer;
        this.handleFailedScrape = handleFailedScrape;
        this.handleSuccessfulScrape = handleSuccessfulScrape;

        this.scrapers = [];
        this.availableScrapers = [];
        this.processingPromises = new Set();
        this.idleTimers = new Map();
    }

    async initialize() {
        console.log(`Initializing ScraperPool with maximum size of ${this.maxPoolSize} scrapers`);
        logMemoryUsage();

        await this.runKafkaConsumer();
    }

    async createScraper() {
        const index = this.scrapers.length;
        const scraper = new PricingScraper({
            proxyAuth: this.proxyAuth,
            proxyServer: this.proxyServer,
            instanceId: `Pricing-Scraper-${index}`
        });

        await scraper.init();
        this.scrapers.push(scraper);
        this.availableScrapers.push(scraper);
        this.startIdleTimer(scraper);

        console.log(`Created new scraper: ${scraper.instanceId}`);
        return scraper;
    }

    startIdleTimer(scraper) {
        const timer = setTimeout(() => this.destroyIdleScraper(scraper), 30000); // 30 seconds
        this.idleTimers.set(scraper, timer);
    }

    resetIdleTimer(scraper) {
        const existingTimer = this.idleTimers.get(scraper);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        this.startIdleTimer(scraper);
    }

    async destroyIdleScraper(scraper) {
        console.log(`Destroying idle scraper: ${scraper.instanceId}`);
        const index = this.scrapers.indexOf(scraper);
        if (index > -1) {
            this.scrapers.splice(index, 1);
        }
        const availableIndex = this.availableScrapers.indexOf(scraper);
        if (availableIndex > -1) {
            this.availableScrapers.splice(availableIndex, 1);
        }
        this.idleTimers.delete(scraper);
        await scraper.destroy();
    }

    async runKafkaConsumer() {
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await this.handleMessage(topic, partition, message);
            },
        });
    }

    async handleMessage(topic, partition, message) {
        if (this.scrapers.length === 0) {
            console.log('Initializing pool to maximum size due to incoming messages');
            for (let i = 0; i < this.maxPoolSize; i++) {
                await this.createScraper();
            }
        }

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
        this.resetIdleTimer(scraper);

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
                this.resetIdleTimer(scraper);
                this.processingPromises.delete(processingPromise);
                logMemoryUsage();
            });

        this.processingPromises.add(processingPromise);
    }

    async scrapeVehicleWithRetry(scraper, startDate, endDate, country, vehicleId, jobId, retryCount = 0) {
        const vehicle = { getId: () => vehicleId };
        const maxRetries = 5;
        const baseDelay = 10000; // base delay of 10 seconds

        try {
            return await scraper.scrape(vehicle, jobId, startDate, endDate);

        } catch (error) {
            if (retryCount < maxRetries) {
                console.log(`[${scraper.instanceId}] Attempt ${retryCount + 1} failed for vehicle ${vehicleId}. Retrying...`);

                await this.destroyIdleScraper(scraper);

                // Exponential backoff
                const sleepDuration = baseDelay * Math.pow(2, retryCount); // 10s, 20s, 40s, etc.
                console.log(`Sleeping for ${sleepDuration / 1000} seconds before retry!`);

                await sleep(sleepDuration);

                const newScraper = await this.createScraper();

                return this.scrapeVehicleWithRetry(newScraper, startDate, endDate, country, vehicleId, jobId, retryCount + 1);
            } else {
                console.log(`[${scraper.instanceId}] All retry attempts failed for vehicle ${vehicleId}.`);
                throw error;
            }
        }
    }

    async close() {
        await Promise.all(Array.from(this.processingPromises));
        for (const scraper of this.scrapers) {
            clearTimeout(this.idleTimers.get(scraper));
            await scraper.close();
        }
        this.scrapers = [];
        this.availableScrapers = [];
        this.idleTimers.clear();
        logMemoryUsage();
    }
}

module.exports = PricingScraperPool;