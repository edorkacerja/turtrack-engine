const { sleep, logMemoryUsage } = require("../utils/utils");
const SearchScraper = require("./SearchScraper");
const Cell = require("../models/Cell");
const { commitOffsetsWithRetry } = require("../utils/kafkaUtil");
const cellutil = require("../utils/cellutil");

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

        this.divider = 2;
        this.recursiveDepth = 10;
    }

    async initialize() {
        console.log(`Initializing ScraperPool with maximum size of ${this.maxPoolSize} scrapers`);
    }

    async createScraper(retryCount = 0) {
        const maxRetries = 3; // Adjust as needed

        // Wait until we can create a new scraper
        while (this.scrapers.length >= this.maxPoolSize) {
            console.log(`Max pool size (${this.maxPoolSize}) reached. Waiting for a scraper to become available...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
        }

        try {
            const index = this.scrapers.length;
            const scraper = new SearchScraper({
                instanceId: `Search-Scraper-${index}`,
                proxyAuth: this.proxyAuth,
                proxyServer: this.proxyServer,
                country: "US",
                delay: 1100,
                headless: false,
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
            this.startIdleTimer(scraper);
            return scraper;
        } catch (error) {
            console.error(`Error creating scraper (attempt ${retryCount + 1}):`, error);

            if (retryCount < maxRetries) {
                console.log(`Retrying scraper creation in 10 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Sleep for 10 seconds
                return this.createScraper(retryCount + 1);
            } else {
                console.error(`Failed to create scraper after ${maxRetries} attempts`);
                throw new Error(`Failed to create scraper after ${maxRetries} attempts`);
            }
        }
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

        const processingPromise = this.recursiveFetch(scraper, cell, 0, jobId, consumer, topic, partition, message)
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

    async recursiveFetch(scraper, cell, depth, jobId, consumer, topic, partition, message, baseCell = null) {
        if (!baseCell) baseCell = cell;

        if (depth > this.recursiveDepth) {
            console.log(`[${scraper.instanceId}] Max depth reached for cell ${cell.id}`);
            return;
        }

        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const data = await scraper.fetch(cell);

                if (!data?.vehicles) {
                    throw new Error("No vehicles data");
                }

                const vehiclesLength = data.vehicles.length;
                const isSearchRadiusZero = data?.searchLocation?.appliedRadius?.value === 0;

                if (vehiclesLength < 200 || isSearchRadiusZero || depth >= this.recursiveDepth) {
                    cell.setVehicleCount(vehiclesLength);
                    await this.handleSuccessfulScrape({
                        baseCell,
                        optimalCell: cell,
                        scraped: data,
                    });
                    await commitOffsetsWithRetry(consumer, topic, partition, message.offset);
                    return;
                }

                const cells = cellutil.cellSplit(cell, this.divider, this.divider);
                for (let minicell of cells) {
                    await this.recursiveFetch(scraper, minicell, depth + 1, jobId, consumer, topic, partition, message, baseCell);
                }
                return;
            } catch (error) {
                console.error(`[${scraper.instanceId}] Error fetching data for cell: ${JSON.stringify(cell)}`, error);
                retryCount++;

                if (retryCount < maxRetries) {
                    console.log(`[${scraper.instanceId}] Retrying fetch (${retryCount}/${maxRetries})...`);
                    await this.destroyScraper(scraper);
                    scraper = await this.createScraper();
                    await sleep(1100);
                } else {
                    console.error(`[${scraper.instanceId}] Max retries reached for cell ${cell.id}.`);
                    throw error;
                }
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