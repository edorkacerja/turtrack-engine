const { commitOffsetsWithRetry } = require("../utils/kafkaUtil");
const { sleep, logMemoryUsage } = require("../utils/utils");
const SearchScraper = require("./SearchScraper");
const Cell = require("../models/Cell");

class SearchScraperPool {
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
    }

    async initialize() {
        console.log(`Initializing ScraperPool with maximum size of ${this.maxPoolSize} scrapers`);
        logMemoryUsage();

        // Initialize the pool with a few scrapers
        for (let i = 0; i < Math.min(5, this.maxPoolSize); i++) {
            await this.createScraper();
        }

        await this.runKafkaConsumer();
    }

    async createScraper() {
        const index = this.scrapers.length;
        const scraper = new SearchScraper({
            proxyAuth: this.proxyAuth,
            proxyServer: this.proxyServer,
            instanceId: `Search-Scraper-${index}`,
            country: "US", // Set default country, adjust as needed
            delay: 1100,
            headless: false,
            divider: 2,
            recursiveDepth: 10,
            filters: {
                engines: [],
                makes: [],
                models: [],
                tmvTiers: [],
                features: [],
                types: []
            },
            sorts: {
                direction: "ASC",
                type: "DISTANCE"
            },
        });

        await scraper.init();
        this.scrapers.push(scraper);
        this.availableScrapers.push(scraper);

        console.log(`Created new scraper: ${scraper.instanceId}`);
        return scraper;
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
            if (this.scrapers.length < this.maxPoolSize) {
                await this.createScraper();
            } else {
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
        }

        const scraper = this.availableScrapers.pop();

        const messageData = JSON.parse(message.value.toString());
        const { id, bottomLeftLat, bottomLeftLng, topRightLat, topRightLng, jobId } = messageData;
        const cell = new Cell();
        cell.setId(id);
        cell.setBottomLeft(bottomLeftLat, bottomLeftLng);
        cell.setTopRight(topRightLat, topRightLng);
        cell.setCountry("US");

        const processingPromise = this.scrapeCellWithRetry(scraper, cell, jobId)
            .then(async (result) => {
                await this.handleSuccessfulScrape(result);
            })
            .catch(async (error) => {
                console.error(`Error processing cell ${cell.id}:`, error);
                await this.handleFailedScrape(cell, error, jobId);
            })
            .finally(() => {
                commitOffsetsWithRetry(this.consumer, topic, partition, message.offset);
                this.availableScrapers.push(scraper);
                this.processingPromises.delete(processingPromise);
                logMemoryUsage();
            });

        this.processingPromises.add(processingPromise);
    }

    async scrapeCellWithRetry(scraper, cell, jobId, retryCount = 0) {
        const maxRetries = 3;
        const baseDelay = 5000; // base delay of 5 seconds

        try {
            return await scraper.scrape([cell]);
        } catch (error) {
            if (retryCount < maxRetries) {
                console.log(`[${scraper.instanceId}] Attempt ${retryCount + 1} failed for cell ${cell.id}. Retrying...`);

                // Exponential backoff
                const sleepDuration = baseDelay * Math.pow(2, retryCount);
                console.log(`Sleeping for ${sleepDuration / 1000} seconds before retry!`);

                await sleep(sleepDuration);

                return this.scrapeCellWithRetry(scraper, cell, jobId, retryCount + 1);
            } else {
                console.log(`[${scraper.instanceId}] All retry attempts failed for cell ${cell.id}.`);
                throw error;
            }
        }
    }

    async close() {
        await Promise.all(Array.from(this.processingPromises));
        for (const scraper of this.scrapers) {
            await scraper.close();
        }
        this.scrapers = [];
        this.availableScrapers = [];
        logMemoryUsage();
    }
}

module.exports = SearchScraperPool;