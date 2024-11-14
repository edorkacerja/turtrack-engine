const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fetch = require("cross-fetch");
const BaseScraper = require("./BaseScraper");
const { sleep, logMemoryUsage } = require("../utils/utils");

class VehicleDetailScraper extends BaseScraper {
  static type = "vehicle_detail";

  constructor(config) {
    super(config);

    const { instanceId } = config;

    this.instanceId = instanceId || 'unknown';
    this.currentRequestTotalBytes = 0;
  }

  async scrape(vehicleId, jobId, startDate, startTime, endDate, endTime) {

    this.currentRequestTotalBytes = 0;
    await sleep(this.delay);

    try {
      const data = await this.fetchFromTuro(vehicleId, startDate, startTime, endDate, endTime);
      console.log(`[${this.instanceId}] Total data received for vehicle ${vehicleId}: ${this.currentRequestTotalBytes} Bytes`);

      if (this.isValidResponse(data)) {
        console.log(`[${this.instanceId}] Successfully scraped vehicle ${vehicleId}`);
        logMemoryUsage();
        return data;
      } else {
        throw new Error(`[${this.instanceId}] Invalid response structure`);
      }

    } catch (error) {
      console.error(`[${this.instanceId}] Error scraping vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async fetchFromTuro(vehicleId, startDate, startTime, endDate, endTime) {
    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
    };

    const requestConfig = {
      headers,
      method: "GET",
      mode: "cors",
      credentials: "include",
    };

    const queryParams = new URLSearchParams({
      endDate: endDate,
      endTime: endTime,
      startDate: startDate,
      startTime: startTime,
      vehicleId: vehicleId,
    });

    const url = `https://turo.com/api/vehicle/detail?${queryParams.toString()}`;

    try {
      const data = await this.page.evaluate(
          async ({ requestConfig, url }) => {
            try {
              const response = await fetch(url, requestConfig);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            } catch (error) {
              return { error: error.toString() };
            }
            },
          { requestConfig, url }
      );

      // this.updateTotalBytes(data);
      return data;
    } catch (error) {
      console.error(`[${this.instanceId}] Error fetching data for vehicle ${vehicleId}: ${error.message}`);
      throw error;
    }
  }

  updateTotalBytes(data) {
    const responseSize = JSON.stringify(data).length;
    this.currentRequestTotalBytes += responseSize;
  }

  isValidResponse(data) {
    return (
        data &&
        typeof data === 'object' &&
        data.vehicle &&
        typeof data.vehicle === 'object'
    );
  }

  async destroy() {
    try {
      await super.destroy();
      console.log(`[${this.instanceId}] VehicleDetailScraper instance destroyed and data cleared`);
    } catch (error) {
      console.error(`[${this.instanceId}] Error during VehicleDetailScraper destruction:`, error);
    }
  }

  async close() {
    await this.destroy();
  }
}

module.exports = VehicleDetailScraper;