const { sleep, logMemoryUsage } = require("../utils/utils");
const PricingScraper = require("./PricingScraper");
const JobService = require("../services/JobService");
const { Mutex } = require('async-mutex');

class PricingScraperPool {
    constructor(maxPoolSize = 3, proxyAuth, proxyServer, handleFailedScrape, handleSuccessfulScrape) {
        this.maxPoolSize = maxPoolSize;
        this.proxyAuth = proxyAuth;
        this.proxyServer = proxyServer;
        this.handleFailedScrape = handleFailedScrape;
        this.handleSuccessfulScrape = handleSuccessfulScrape;

        this.scrapers = new Map();
        this.availableScrapers = new Set();
        this.idleTimers = new Map();

        this.mutex = new Mutex();
    }

    getAvailableScraper() {
        return this.mutex.runExclusive(() => {
            if (this.availableScrapers.size > 0) {
                const iterator = this.availableScrapers.values();
                const scraperId = iterator.next().value;
                this.availableScrapers.delete(scraperId);
                return this.scrapers.get(scraperId);
            }
            return null;
        });
    }

    addScraper(scraper) {
        return this.mutex.runExclusive(() => {
            // this.scrapers.set(scraper.instanceId, scraper);
            this.availableScrapers.add(scraper.instanceId);
        });
    }

    removeScraper(scraperId) {
        return this.mutex.runExclusive(() => {
            const scraper = this.scrapers.get(scraperId);
            this.scrapers.delete(scraperId);
            this.availableScrapers.delete(scraperId);
            return scraper;
        });
    }

    getScraperCount() {
        return this.mutex.runExclusive(() => this.scrapers.size);
    }

    async handleMessage(message, channel) {
        const messageData = JSON.parse(message.content.toString());
        const { vehicleId, country, jobId, startDate, endDate } = messageData;
        console.log(`[handleMessage] Processing vehicle ${vehicleId} for job ${jobId}.`);

        try {
            console.log(`[handleMessage] Checking if job ${jobId} is running.`);
            const isJobRunning = await JobService.isJobRunning(jobId);

            if (!isJobRunning) {
                console.log(`[handleMessage] Job ${jobId} is no longer running. Acknowledging message.`);
                return;
            }

            console.log(`[handleMessage] Fetching data for vehicle ${vehicleId}.`);
            const data = await this.fetchWithRetry(vehicleId, jobId, startDate, endDate);

            console.log(`[handleMessage] Processing successful scrape for vehicle ${vehicleId}.`);
            await this.handleSuccessfulScrape({
                success: true,
                vehicleId,
                scraped: data,
                jobId: jobId
            });

            console.log(`[handleMessage] Finished processing vehicle ${vehicleId}.`);
        } catch (error) {
            console.error(`[handleMessage] Error processing vehicle ${vehicleId}:`, error);
            await this.handleFailedScrape({ id: vehicleId }, error, jobId);
        }
    }

    async fetchWithRetry(vehicleId, jobId, startDate, endDate, maxRetries = 10) {
        let scraper;
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                const isJobRunning = await JobService.isJobRunning(jobId);
                if (!isJobRunning) {
                    console.log(`[fetchWithRetry] Job ${jobId} is no longer running. Stopping retry attempts.`);
                    throw new Error("Job is no longer running");
                }

                if (!scraper) scraper = await this.acquireScraper();

                console.log(`[handleMessage] Acquired scraper ${scraper.instanceId} for vehicle ${vehicleId}.`);

                const data = await scraper.scrape(vehicleId, jobId, startDate, endDate);
                if (!data) {
                    throw new Error("No data returned from fetchFromTuro");
                }
                return data;
            } catch (error) {
                console.error(`[fetchWithRetry] Error fetching data for vehicle ${vehicleId} (Attempt ${retryCount + 1}):`, error);
                retryCount++;

                if (retryCount >= maxRetries) {
                    console.error(`[fetchWithRetry] Max retries reached for vehicle ${vehicleId}. Throwing error.`);
                    throw error;
                }

                if (scraper) {
                    await this.destroyScraper(scraper.instanceId);
                    scraper = null;
                }

                console.log(`[fetchWithRetry] Retrying fetch (${retryCount}/${maxRetries}) after error.`);
                // await sleep(1100);
            } finally {
                if(scraper) {
                    await this.releaseScraper(scraper);
                }
            }
        }
    }

    async createScraper(retryCount = 0, scraperId) {
        const maxRetries = 3;

        let scraper;
        try {
            const instanceId = scraperId ? scraperId : `Pricing-Scraper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            console.log(`[createScraper] Attempting to create scraper with ID: ${instanceId}`);

             scraper = new PricingScraper({
                instanceId: instanceId,
                proxyAuth: this.proxyAuth,
                proxyServer: this.proxyServer,
                delay: 1100,
                headless: false,
            });

            // take space in the scraper zone
            await this.mutex.runExclusive( () => {
                this.scrapers.set(scraper.instanceId, scraper);
                // this.availableScrapers.add(scraper.instanceId);
            });

            await this.mutex.runExclusive(async () => {
                await sleep(1000);
            });


            console.log(`[createScraper] Initializing scraper ${instanceId}...`);
            await scraper.init();

            await this.addScraper(scraper);

            console.log(`Created new scraper: ${scraper.instanceId}. Total scrapers: ${await this.getScraperCount()}`);
            this.startIdleTimer(scraper);
        } catch (error) {
            console.error(`[createScraper] Error creating scraper (attempt ${retryCount + 1}):`, error);

            if (retryCount < maxRetries) {
                console.log(`[createScraper] Retrying scraper creation in 10 seconds...`);
                // await sleep(10000);
                return this.createScraper(retryCount + 1, scraperId);
            } else {
                console.error(`[createScraper] Failed to create scraper after ${maxRetries} attempts`);
                await this.mutex.runExclusive( () => {
                    this.scrapers.delete(scraper.instanceId);
                    // this.availableScrapers.add(scraper.instanceId);
                });

                throw new Error(`Failed to create scraper after ${maxRetries} attempts`);
            }
        }
    }

    async acquireScraper() {
        while (true) {
            let scraper = await this.getAvailableScraper();
            if (scraper) {
                this.stopIdleTimer(scraper);
                return scraper;
            }

            const scraperCount = await this.getScraperCount();
            if (scraperCount < this.maxPoolSize) {
                const scraperId = `Pricing-Scraper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                try {
                    console.log(`[acquireScraper] Creating a new scraper...`);
                    await this.createScraper(0, scraperId);
                    // await sleep(1000);
                    scraper = await this.getAvailableScraper();
                    if (scraper) return scraper;
                } catch (error) {
                    console.error(`[acquireScraper] Error while creating new scraper:`, error);
                    throw error;
                }
            } else {
                console.warn(`[acquireScraper] All scrapers are busy. Waiting for an available scraper...`);
                await sleep(10000);
            }
        }
    }

    releaseScraper(scraper) {
        return this.mutex.runExclusive(() => {
            if (this.scrapers.has(scraper.instanceId)) {
                this.availableScrapers.add(scraper.instanceId);
                this.startIdleTimer(scraper);
                console.log(`[releaseScraper] Scraper ${scraper.instanceId} released back to pool.`);
            } else {
                console.warn(`[releaseScraper] Scraper ${scraper.instanceId} not found in scrapers map during release.`);
            }
        });
    }

    startIdleTimer(scraper) {
        console.log(`[startIdleTimer] Starting idle timer for scraper ${scraper.instanceId}.`);
        if (this.idleTimers.has(scraper.instanceId)) {
            clearTimeout(this.idleTimers.get(scraper.instanceId));
            console.log(`[startIdleTimer] Cleared existing idle timer for scraper ${scraper.instanceId}.`);
        }

        const timer = setTimeout(() => {
            console.log(`[startIdleTimer] Scraper ${scraper.instanceId} has been idle for 3 mins. Destroying...`);
            this.destroyScraper(scraper.instanceId);
        }, 180000);

        this.idleTimers.set(scraper.instanceId, timer);
    }

    stopIdleTimer(scraper) {
        console.log(`[stopIdleTimer] Stopping idle timer for scraper ${scraper.instanceId}.`);
        if (this.idleTimers.has(scraper.instanceId)) {
            clearTimeout(this.idleTimers.get(scraper.instanceId));
            this.idleTimers.delete(scraper.instanceId);
            console.log(`[stopIdleTimer] Idle timer stopped and removed for scraper ${scraper.instanceId}.`);
        }
    }

    async destroyScraper(scraperId, maxRetries = 3) {
        console.log(`Attempting to destroy scraper ${scraperId}`);

        let retries = 0;

        while (retries < maxRetries) {
            try {
                // Get and remove the scraper atomically
                const scraper = await this.removeScraper(scraperId);

                if (this.idleTimers.has(scraperId)) {
                    clearTimeout(this.idleTimers.get(scraperId));
                    this.idleTimers.delete(scraperId);
                }

                if (scraper) {
                    await scraper.close();
                    console.log(`Scraper ${scraperId} closed successfully`);
                } else {
                    console.warn(`Scraper ${scraperId} not found in pool`);
                }

                console.log(`Scraper ${scraperId} destroyed successfully`);
                break;
            } catch (error) {
                console.error(`Error destroying scraper ${scraperId} (Attempt ${retries + 1}):`, error);
                retries++;
                if (retries >= maxRetries) {
                    console.error(`Failed to destroy scraper ${scraperId} after ${maxRetries} attempts`);
                    // Ensure scraper is removed from all collections even if closing fails
                    await this.removeScraper(scraperId);
                    this.idleTimers.delete(scraperId);
                    break;
                }
                // await sleep(1000);
            }
        }

        console.log(`Total scrapers remaining: ${await this.getScraperCount()}`);
    }

    async close() {
        console.log(`[close] Closing ScraperPool and all scrapers.`);
        const scraperPromises = Array.from(this.scrapers.values()).map(scraper => scraper.close());
        await Promise.all(scraperPromises);
        this.scrapers.clear();
        this.availableScrapers.clear();
        this.idleTimers.forEach(timer => clearTimeout(timer));
        this.idleTimers.clear();
        console.log(`[close] ScraperPool closed.`);
    }
}

module.exports = PricingScraperPool;