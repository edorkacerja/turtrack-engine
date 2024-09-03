const BaseScraper = require("./BaseScraper");
const { sleep, getRandomInt } = require("../utils/utils");

class PricingScraper extends BaseScraper {
  static type = "pricing";

  constructor(config) {
    super(config);

    const { instanceId } = config;

    this.instanceId = instanceId || 'unknown';

    this.onSuccessCallback = () => {};
    this.onFailedCallback = () => {};
    this.onFinishCallback = () => {};
    this.currentRequestTotalBytes = 0;
  }

  async recreateBrowserInstance() {
    console.log(`Recreating browser instance...`);
    if (this.browser) {
      await this.browser.close();
    }

    await this.init();
    console.log(`Browser instance recreated successfully.`);
  }

  async scrape(vehicle, jobId, startDate, endDate) {
    const results = [];

      const vehicleId = vehicle.getId();
      try {
        this.currentRequestTotalBytes = 0;
        const data = await this.fetchFromTuro(vehicleId, startDate, endDate);
        console.log(`[${this.instanceId}] Total data received for vehicle ${vehicleId}: ${this.currentRequestTotalBytes} Bytes`);

        if (this.isValidResponse(data)) {
          this.onSuccessCallback({
            id: vehicleId,
            vehicle,
            scraped: { ...data, jobId },
          });
          results.push({ success: true, vehicleId, scraped: {...data, jobId} });
          console.log(`[${this.instanceId}] Successfully scraped vehicle ${vehicleId}`);
        } else {
          throw new Error("[${this.instanceId}] Invalid response structure");
        }
      } catch (error) {
        this.handleScrapingError(vehicle, error);
        results.push({ success: false, vehicleId, error: error.message });
      }

      await sleep(this.delay);


    this.onFinishCallback(results);
    return results;
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

  handleScrapingError(vehicle, error) {
    this.onFailedCallback({ vehicle, error });
    console.error(`[${this.instanceId}] Failed to scrape vehicle ${vehicle.getId()}: ${error.message}`);
  }

  onSuccess(callback) {
    this.onSuccessCallback = callback;
  }

  onFailed(callback) {
    this.onFailedCallback = callback;
  }

  onFinish(callback) {
    this.onFinishCallback = callback;
  }
}

module.exports = PricingScraper;