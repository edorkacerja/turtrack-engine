const BaseScraper = require("./BaseScraper");
const { sleep, getRandomInt, logMemoryUsage } = require("../utils/utils");

class PricingScraper extends BaseScraper {
  static type = "pricing";

  constructor(config) {
    super(config);

    const { instanceId } = config;

    this.instanceId = instanceId || 'unknown';
    this.currentRequestTotalBytes = 0;
  }

  async scrape(vehicle, jobId, startDate, endDate) {

    const vehicleId = vehicle.getId();
    this.currentRequestTotalBytes = 0;

    try {
      const data = await this.fetchFromTuro(vehicleId, startDate, endDate);
      console.log(`[${this.instanceId}] Total data received for vehicle ${vehicleId}: ${this.currentRequestTotalBytes} Bytes`);

      if (this.isValidResponse(data)) {
        const result = { success: true, vehicleId, scraped: {...data, jobId} };
        console.log(`[${this.instanceId}] Successfully scraped vehicle ${vehicleId}`);
        await sleep(this.delay);
        logMemoryUsage();
        return result;
      } else {
        throw new Error(`[${this.instanceId}] Invalid response structure`);
      }

    } catch (error) {
      console.error(`[${this.instanceId}] Error scraping vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async fetchFromTuro(vehicleId, startDate, endDate) {
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
      end: endDate,
      start: startDate,
      vehicleId,
    });

    const url = `https://turo.com/api/vehicle/daily_pricing?${queryParams.toString()}`;

    try {
      const data = await this.page.evaluate(
          async ({ requestConfig, url }) => {
            const response = await fetch(url, requestConfig);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          },
          { requestConfig, url }
      );

      this.updateTotalBytes(data);

      return {
        ...data,
        vehicleId,
        scrapedBy: this.instanceId
      };
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
        Array.isArray(data.dailyPricingResponses) &&
        typeof data.calendarCurrencyHeader === 'string' &&
        typeof data.vehicleId === 'string' &&
        typeof data.scrapedBy === 'string'
    );
  }

  async destroy() {
    try {
      await super.destroy();
      console.log(`[${this.instanceId}] PricingScraper instance destroyed and data cleared`);
    } catch (error) {
      console.error(`[${this.instanceId}] Error during PricingScraper destruction:`, error);
    }
  }

  async close() {
    await this.destroy();
  }
}

module.exports = PricingScraper;