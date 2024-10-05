const { sleep, logMemoryUsage } = require("../utils/utils");
const SearchScraper = require("./SearchScraper");
const Cell = require("../models/Cell");

class SearchScraperPool {
    constructor(maxPoolSize = 60,
                proxyAuth,
                proxyServer,
                handleFailedScrape,
                handleSuccessfulScrape) {
        this.maxPoolSize = maxPoolSize;
        this.proxyAuth = proxyAuth;
        this.proxyServer = proxyServer;
        this.handleFailedScrape = handleFailedScrape;
        this.handleSuccessfulScrape = handleSuccessfulScrape;

        this.scrapers = [];
        this.availableScrapers = [];
        this.processingPromises = new Set();
    }

    async initialize() {
        console.log(`Initializing ScraperPool with maximum size of ${this.maxPoolSize} scrapers`);
        // logMemoryUsage();

        // Initialize the pool with a few scrapers
        for (let i = 0; i < Math.min(5, this.maxPoolSize); i++) {
            await this.createScraper();

            await sleep(2000);
        }

    }

    async createScraper() {
        const index = this.scrapers.length;
        const scraper = new SearchScraper({
            instanceId: `Search-Scraper-${index}`,
            proxyAuth: this.proxyAuth,
            proxyServer: this.proxyServer,
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


        scraper.onSuccess(this.handleSuccessfulScrape);

        await scraper.init();
        this.scrapers.push(scraper);
        this.availableScrapers.push(scraper);

        console.log(`Created new scraper: ${scraper.instanceId}`);
        return scraper;
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
            console.log(`Destroyed scraper: ${scraper.instanceId}. Total scrapers: ${this.scrapers.length}`);
        } catch (error) {
            console.error(`Error destroying scraper ${scraper.instanceId}:`, error);
        }
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
            .catch(async (error) => {
                console.error(`[${scraper.instanceId}] Error processing cell ${cell.id}:`, error);
                await this.handleFailedScrape(cell, error, jobId, topic, partition, message);
            })
            .finally(() => {

                // Return the scraper to the available pool only if it's still in the scrapers array
                if (this.scrapers.includes(scraper)) {
                    this.availableScrapers.push(scraper);
                }
                this.processingPromises.delete(processingPromise);
                // logMemoryUsage();
            });

        this.processingPromises.add(processingPromise);
    }

    async scrapeCellWithRetry(scraper, cell, jobId, retryCount = 0) {
        const maxRetries = 3;

        try {
            await scraper.scrape([cell]);
        } catch (error) {
            console.log(`[${scraper.instanceId}] Scrape failed for cell ${cell.id}. Destroying scraper and creating a new one.`);
            await this.destroyScraper(scraper);

            if (this.scrapers.length < this.maxPoolSize) {
                const newScraper = await this.createScraper();
                if (retryCount < maxRetries) {
                    console.log(`Retrying scrape for cell ${cell.id} with new scraper ${newScraper.instanceId}. Retry attempt ${retryCount + 1}.`);
                    return this.scrapeCellWithRetry(newScraper, cell, jobId, retryCount + 1);
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
        // logMemoryUsage();
    }
}

module.exports = SearchScraperPool;
