const { sleep, logMemoryUsage } = require("../utils/utils");
const PricingScraper = require("./PricingScraper");
const JobService = require("../services/JobService");
const { Mutex } = require('async-mutex');

class PricingScraperPool {
    constructor(
        maxPoolSize = 3,
        proxyAuth,
        proxyServer,
        handleFailedScrape,
        handleSuccessfulScrape,
    ) {
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
                vehicleId,
                scraped: data,
                jobId: jobId
            });

            console.log(`[handleMessage] Finished processing vehicle ${vehicleId}.`);
        } catch (error) {
            console.error(`[handleMessage] Error processing vehicle ${vehicleId}:`, error);
            await this.handleFailedScrape({ id: vehicleId }, error, jobId);
        } finally {
            if (scraper) {
                await this.releaseScraper(scraper);
            }
        }
    }

    async fetchWithRetry( vehicleId, jobId, startDate, endDate, maxRetries = 10) {
        let scraper;
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                const isJobRunning = await JobService.isJobRunning(jobId);
                if (!isJobRunning) {
                    console.log(`[fetchWithRetry] Job ${jobId} is no longer running. Stopping retry attempts.`);
                    throw new Error("Job is no longer running");
                }

                scraper = await this.acquireScraper();
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

                await this.destroyScraper(scraper.instanceId);
                scraper = await this.acquireScraper();
                console.log(`[fetchWithRetry] Acquired new scraper ${scraper.instanceId} for retry.`);

                console.log(`[fetchWithRetry] Retrying fetch (${retryCount}/${maxRetries}) after error.`);
                await sleep(1100);
            }
        }
    }

    async createScraper(retryCount = 0, scraperId) {
        const maxRetries = 3;

        try {
            const instanceId = scraperId ? scraperId : `Pricing-Scraper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            console.log(`[createScraper] Attempting to create scraper with ID: ${instanceId}`);

            const scraper = new PricingScraper({
                instanceId: instanceId,
                proxyAuth: this.proxyAuth,
                proxyServer: this.proxyServer,
                // country: "US",
                delay: 1100,
                headless: false,
            });

            console.log(`[createScraper] Initializing scraper ${instanceId}...`);
            await scraper.init();
            console.log(`[createScraper] Scraper ${instanceId} initialized successfully.`);

            await this.mutex.runExclusive(() => {
                console.log(`[createScraper] Acquired mutex to add scraper ${instanceId} to pool.`);
                this.scrapers.set(instanceId, scraper);
                this.availableScrapers.add(instanceId);
                console.log(`[createScraper] Scraper ${instanceId} added to pool.`);
            });

            console.log(`Created new scraper: ${scraper.instanceId}. Total scrapers: ${this.scrapers.size}`);
            this.startIdleTimer(scraper);
        } catch (error) {
            console.error(`[createScraper] Error creating scraper (attempt ${retryCount + 1}):`, error);

            if (retryCount < maxRetries) {
                console.log(`[createScraper] Retrying scraper creation in 10 seconds...`);
                await sleep(10000);
                return this.createScraper(retryCount + 1, scraperId);
            } else {
                console.error(`[createScraper] Failed to create scraper after ${maxRetries} attempts`);
                throw new Error(`Failed to create scraper after ${maxRetries} attempts`);
            }
        }
    }

    async acquireScraper() {
        while (true) {
            let scraper = null;
            let scraperId = null;

            await this.mutex.runExclusive(async () => {
                console.log(`[acquireScraper] Acquired mutex to check for available scrapers.`);
                if (this.availableScrapers.size > 0) {
                    const iterator = this.availableScrapers.values();
                    let availableScraperId = iterator.next().value;
                    this.availableScrapers.delete(availableScraperId);
                    scraper = this.scrapers.get(availableScraperId);
                    this.stopIdleTimer(scraper);
                    console.log(`[acquireScraper] Assigned available scraper ${availableScraperId} to requester.`);
                } else if (this.scrapers.size < this.maxPoolSize) {
                    scraperId = `Pricing-Scraper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                    this.scrapers.set(scraperId, null);
                    console.log(`[acquireScraper] Pool size (${this.scrapers.size}) is less than max (${this.maxPoolSize}). Will create a new scraper.`);
                } else {
                    console.log(`[acquireScraper] No available scrapers and pool size has reached max (${this.maxPoolSize}).`);
                }
            });

            if (scraper) {
                console.log(`[acquireScraper] Returning scraper ${scraper.instanceId} to requester.`);
                return scraper;
            }

            if (scraperId !== null) {
                try {
                    console.log(`[acquireScraper] Creating a new scraper...`);
                    await this.createScraper(0, scraperId);
                    await sleep(1000);
                } catch (error) {
                    console.error(`[acquireScraper] Error while creating new scraper:`, error);
                    throw error;
                }
            } else {
                console.warn(`[acquireScraper] All scrapers are busy. Waiting for an available scraper...`);
                await sleep(10000);
            }
            await sleep(2000);

        }
    }

    async releaseScraper(scraper) {
        await this.mutex.runExclusive(() => {
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
                let scraper;

                // Critical section: remove scraper from pool
                await this.mutex.runExclusive(() => {
                    scraper = this.scrapers.get(scraperId);
                    if (scraper) {
                        this.scrapers.delete(scraperId);
                        this.availableScrapers.delete(scraperId);
                        if (this.idleTimers.has(scraperId)) {
                            clearTimeout(this.idleTimers.get(scraperId));
                            this.idleTimers.delete(scraperId);
                        }
                        console.log(`Scraper ${scraperId} removed from pool`);
                    }
                });

                // Close the scraper outside the mutex
                if (scraper) {
                    await scraper.close();
                    console.log(`Scraper ${scraperId} closed successfully`);
                } else {
                    console.warn(`Scraper ${scraperId} not found in pool`);
                }

                // If we've made it here, everything succeeded
                console.log(`Scraper ${scraperId} destroyed successfully`);
                break;

            } catch (error) {
                console.error(`Error destroying scraper ${scraperId} (Attempt ${retries + 1}):`, error);
                retries++;
                if (retries >= maxRetries) {
                    console.error(`Failed to destroy scraper ${scraperId} after ${maxRetries} attempts`);
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between retries
            }
        }

        console.log(`Total scrapers remaining: ${this.scrapers.size}`);
    }

    async close() {
        console.log(`[close] Closing ScraperPool and all scrapers.`);
        for (const scraper of this.scrapers.values()) {
            await scraper.close();
            console.log(`[close] Closed scraper ${scraper.instanceId}.`);
        }
        this.scrapers.clear();
        this.availableScrapers.clear();
        this.idleTimers.forEach(timer => clearTimeout(timer));
        this.idleTimers.clear();
        console.log(`[close] ScraperPool closed.`);
    }
}

module.exports = PricingScraperPool;