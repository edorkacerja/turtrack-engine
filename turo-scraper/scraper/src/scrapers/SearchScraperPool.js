const { sleep, logMemoryUsage } = require("../utils/utils");
const SearchScraper = require("./SearchScraper");
const Cell = require("../models/Cell");
const {commitOffsetsWithRetry} = require("../utils/kafkaUtil");

class SearchScraperPool {
    constructor(
        maxPoolSize = 10,
        proxyAuth,
        proxyServer,
        handleFailedScrape,
        handleSuccessfulScrape,
        pauseConsumer,
        resumeConsumer
    ) {
        this.maxPoolSize = maxPoolSize;
        this.proxyAuth = proxyAuth;
        this.proxyServer = proxyServer;
        this.handleFailedScrape = handleFailedScrape;
        this.handleSuccessfulScrape = handleSuccessfulScrape;
        this.pauseConsumer = pauseConsumer;
        this.resumeConsumer = resumeConsumer;

        this.scrapers = [];
        this.availableScrapers = [];
        this.processingPromises = new Set();
        this.isConsumerPaused = false;
        this.idleTimers = new Map();
    }

    async initialize() {
        console.log(`Initializing ScraperPool with maximum size of ${this.maxPoolSize} scrapers`);
    }

    async createScraper() {
        const index = this.scrapers.length;
        const scraper = new SearchScraper({
            instanceId: `Search-Scraper-${index}`,
            proxyAuth: this.proxyAuth,
            proxyServer: this.proxyServer,
            country: "US",
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

        scraper.onSuccess(this.handleSuccessfulScrape);

        await scraper.init();
        this.scrapers.push(scraper);
        this.availableScrapers.push(scraper);

        console.log(`Created new scraper: ${scraper.instanceId}`);
        this.startIdleTimer(scraper);
        return scraper;
    }

    startIdleTimer(scraper) {
        if (this.idleTimers.has(scraper)) {
            clearTimeout(this.idleTimers.get(scraper));
        }

        const timer = setTimeout(() => {
            console.log(`Scraper ${scraper.instanceId} has been idle for 30 seconds. Destroying...`);
            this.destroyScraper(scraper);
        }, 30000);

        this.idleTimers.set(scraper, timer);
    }

    resetIdleTimer(scraper) {
        this.startIdleTimer(scraper);
    }

    async destroyScraper(scraper) {
        try {
            await scraper.close();
            const index = this.scrapers.indexOf(scraper);
            if (index !== -1) {
                this.scrapers.splice(index, 1);
            }
            const availableIndex = this.availableScrapers.indexOf(scraper);
            if (availableIndex !== -1) {
                this.availableScrapers.splice(availableIndex, 1);
            }
            if (this.idleTimers.has(scraper)) {
                clearTimeout(this.idleTimers.get(scraper));
                this.idleTimers.delete(scraper);
            }
            console.log(`Destroyed scraper: ${scraper.instanceId}. Total scrapers: ${this.scrapers.length}`);
        } catch (error) {
            console.error(`Error destroying scraper ${scraper.instanceId}:`, error);
        }
    }

    async handleMessage(topic, partition, message, consumer) {
        if (this.availableScrapers.length === 0) {
            if (this.scrapers.length < this.maxPoolSize) {
                await this.createScraper();
            } else {
                if (!this.isConsumerPaused) {
                    await this.pauseConsumer();
                    this.isConsumerPaused = true;
                }
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (this.availableScrapers.length > 0) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 100);
                });
                if (this.isConsumerPaused && this.availableScrapers.length > 0) {
                    await this.resumeConsumer();
                    this.isConsumerPaused = false;
                }
            }
        }

        const scraper = this.availableScrapers.pop();
        this.resetIdleTimer(scraper);

        const messageData = JSON.parse(message.value.toString());
        const { id, cellSize, bottomLeftLat, bottomLeftLng, topRightLat, topRightLng, jobId } = messageData;
        const cell = new Cell();
        cell.setId(id);
        cell.setBottomLeft(bottomLeftLat, bottomLeftLng);
        cell.setTopRight(topRightLat, topRightLng);
        cell.setCountry("US");
        cell.setCellSize(cellSize);

        const processingPromise = this.scrapeCellWithRetry(scraper, cell, jobId, consumer, topic, partition, message)
            .catch(async (error) => {
                console.error(`[${scraper.instanceId}] Error processing cell ${cell.id}:`, error);
                await this.handleFailedScrape(cell, error, jobId, topic, partition, message);
            })
            .finally(async () => {
                if (this.scrapers.includes(scraper)) {
                    this.availableScrapers.push(scraper);
                    this.resetIdleTimer(scraper);
                }
                this.processingPromises.delete(processingPromise);

                if (this.isConsumerPaused && this.availableScrapers.length > 0) {
                    await this.resumeConsumer();
                    this.isConsumerPaused = false;
                }
            });

        this.processingPromises.add(processingPromise);
    }

    async scrapeCellWithRetry(scraper, cell, jobId, consumer, topic, partition, message, retryCount = 0) {
        const maxRetries = 5;

        try {
            await scraper.scrape([cell]);
            await commitOffsetsWithRetry(consumer, topic, partition, message.offset);
        } catch (error) {
            console.log(`[${scraper.instanceId}] Scrape failed for cell ${cell.id}. Destroying scraper and creating a new one.`);
            await this.destroyScraper(scraper);

            if (this.scrapers.length < this.maxPoolSize) {
                const newScraper = await this.createScraper();
                if (retryCount < maxRetries) {
                    console.log(`Retrying scrape for cell ${cell.id} with new scraper ${newScraper.instanceId}. Retry attempt ${retryCount + 1}.`);
                    return this.scrapeCellWithRetry(newScraper, cell, jobId, consumer, topic, partition, message, retryCount + 1);
                } else {
                    console.log(`All retry attempts failed for cell ${cell.id}.`);
                    throw error;
                }
            } else {
                console.log(`Max pool size reached. Cannot create new scraper for cell ${cell.id}.`);
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
        this.idleTimers.forEach(timer => clearTimeout(timer));
        this.idleTimers.clear();
    }
}

module.exports = SearchScraperPool;