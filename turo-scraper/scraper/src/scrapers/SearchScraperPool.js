const { sleep, logMemoryUsage } = require("../utils/utils");
const SearchScraper = require("./SearchScraper");
const Cell = require("../models/Cell");
const cellutil = require("../utils/cellutil");
const JobService = require("../services/JobService");
const { Mutex } = require('async-mutex');

class SearchScraperPool {
    constructor(
        maxPoolSize = 10,
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

        this.divider = 2;
        this.mutex = new Mutex();
    }


    async handleMessage(message, channel) {

        const messageData = JSON.parse(message.content.toString());
        const { id, country, cellSize, bottomLeftLat, bottomLeftLng, topRightLat, topRightLng, jobId, updateOptimalCell, recursiveDepth } = messageData;
        console.log(`[handleMessage] Processing cell ${id} for job ${jobId}.`);

        const cell = new Cell();
        cell.setId(id);
        cell.setBottomLeft(bottomLeftLat, bottomLeftLng);
        cell.setTopRight(topRightLat, topRightLng);
        cell.setCountry(country);
        cell.setCellSize(cellSize);

        const cancellationToken = { isCanceled: false };

        try {
            await this.recursiveFetch(cell, 0, jobId, channel, recursiveDepth, null, updateOptimalCell, cancellationToken);
            console.log(`[handleMessage] Finished processing cell ${cell.id}.`);
        } catch (error) {
            console.error(`[handleMessage] Error processing cell ${cell.id}:`, error);
            await this.handleFailedScrape(cell, error, jobId, message);
        }
    }

    async recursiveFetch(cell, depth, jobId, channel, recursiveDepth, baseCell, updateOptimalCell = false, cancellationToken) {
        if (cancellationToken.isCanceled) {
            console.log(`[recursiveFetch] Job ${jobId} has been canceled. Stopping recursion for cell ${cell.id}.`);
            return;
        }

        if (!baseCell) baseCell = cell;

        console.log(`[recursiveFetch] Starting recursive fetch for cell ${cell.id} at depth ${depth}.`);

        if (depth > recursiveDepth) {
            console.log(`[recursiveFetch] Max depth (${recursiveDepth}) reached for cell ${cell.id}.`);
            return;
        }

        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            let scraper;
            try {
                if (cancellationToken.isCanceled) {
                    console.log(`[recursiveFetch] Job ${jobId} has been canceled during retry loop. Stopping recursion for cell ${cell.id}.`);
                    return;
                }

                console.log(`[recursiveFetch] Checking if job ${jobId} is running.`);
                const isJobRunning = await JobService.isJobRunning(jobId);

                if (!isJobRunning) {
                    console.log(`[recursiveFetch] Job ${jobId} is no longer running. Setting cancellation token.`);
                    cancellationToken.isCanceled = true;
                    return;
                }

                scraper = await this.acquireScraper();
                console.log(`[recursiveFetch] Acquired scraper ${scraper.instanceId} for cell ${cell.id}.`);

                console.log(`[recursiveFetch] Fetching data for cell ${cell.id}.`);
                const data = await scraper.fetch(cell);

                await this.releaseScraper(scraper);
                scraper = null;
                console.log(`[recursiveFetch] Released scraper after fetching data for cell ${cell.id}.`);

                if (!data?.vehicles) {
                    throw new Error("No vehicles data");
                }

                const vehiclesLength = data.vehicles.length;
                const isSearchRadiusZero = data?.searchLocation?.appliedRadius?.value === 0;

                if (vehiclesLength < 200 || isSearchRadiusZero || depth >= recursiveDepth) {
                    cell.setVehicleCount(vehiclesLength);
                    await this.handleSuccessfulScrape({
                        baseCell,
                        optimalCell: cell,
                        scraped: data,
                        jobId: jobId,
                        updateOptimalCell: updateOptimalCell
                    });
                    return;
                }

                await JobService.incrementJobTotalItems(jobId, 3);

                const cells = cellutil.cellSplit(cell, this.divider, this.divider);
                for (let minicell of cells) {
                    console.log(`[recursiveFetch] Recursively fetching minicell ${minicell.id}.`);
                    await this.recursiveFetch(minicell, depth + 1, jobId, channel, recursiveDepth, baseCell, updateOptimalCell, cancellationToken);
                    if (cancellationToken.isCanceled) {
                        console.warn(`[recursiveFetch] Cancellation detected during recursion. Stopping recursion for minicell ${minicell.id}.`);
                        return;
                    }
                }
                return;
            } catch (error) {
                console.error(`[recursiveFetch] Error fetching data for cell ${cell.id}:`, error);
                retryCount++;

                if (scraper) {
                    await this.destroyScraper(scraper.instanceId);
                    scraper = null;
                }

                if (retryCount < maxRetries) {
                    console.log(`[recursiveFetch] Retrying fetch (${retryCount}/${maxRetries}) after error.`);
                    await sleep(1100);
                } else {
                    console.error(`[recursiveFetch] Max retries reached for cell ${cell.id}. Throwing error.`);
                    throw error;
                }
            }
        }
    }

    async createScraper(retryCount = 0, scraperId) {
        const maxRetries = 3;

        try {
            const instanceId = scraperId ? scraperId : `Search-Scraper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            console.log(`[createScraper] Attempting to create scraper with ID: ${instanceId}`);

            const scraper = new SearchScraper({
                instanceId: instanceId,
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
                    scraperId = `Search-Scraper-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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

module.exports = SearchScraperPool;
