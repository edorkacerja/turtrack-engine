const BaseScraper = require("./BaseScraper");
const {sleep, getRandomInt} = require("../utils/utils");

class PricingScraper extends BaseScraper {
  static type = "pricing";

  constructor(config) {
    super(config);

    const { startDate, endDate, country, instanceId } = config;

    this.startDate = startDate;
    this.endDate = endDate;
    this.localResourceName = `${country}.vehicles`;
    this.instanceId = instanceId || 'unknown';

    this.onSuccessCallback = () => {};
    this.onFailedCallback = () => {};
    this.onFinishCallback = () => {};
  }

  async recreateBrowserInstance() {
    console.log(`[Instance ${this.instanceId}] Recreating browser instance...`);
    if (this.browser) {
      await this.browser.close();
    }



    await this.init();







    console.log(`[Instance ${this.instanceId}] Browser instance recreated successfully.`);
  }

  async scrape(vehicles) {
    const results = [];
    for (let vehicle of vehicles) {
      if (!this.isRunning()) break;

      const vehicleId = vehicle.getId();

      try {
        // await this.logIpAddress();
        const data = await this.fetch(vehicleId);
        if (this.isValidResponse(data)) {
          this.onSuccessCallback({
            id: vehicleId,
            vehicle,
            scraped: data,
          });
          results.push({ success: true, vehicleId });
          console.log(`[Instance ${this.instanceId}] Successfully scraped vehicle ${vehicleId}`);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (error) {
        this.onFailedCallback({ vehicle, error });
        console.error(`[Instance ${this.instanceId}] Failed to scrape vehicle ${vehicleId}: ${error.message}`);
        results.push({ success: false, vehicleId, error: error.message });
      }

      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    this.onFinishCallback(results);
    return results;
  }

  async fetch(vehicleId) {
    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
    };

    const requestConfig = {
      headers,
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    };

    const queryParams = new URLSearchParams();
    queryParams.append("end", this.endDate);
    queryParams.append("start", this.startDate);
    queryParams.append("vehicleId", vehicleId);

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

      return {
        ...data,
        vehicleId,
        scrapedBy: this.instanceId
      };
    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Error fetching data for vehicle ${vehicleId}: ${error.message}`);
      throw error;
    }
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

  async onSuccess(callfunction) {
    this.onSuccessCallback = callfunction;
  }

  async onFailed(callfunction) {
    this.onFailedCallback = callfunction;
  }

  async onFinish(callfunction) {
    this.onFinishCallback = callfunction;
  }
}

module.exports = PricingScraper;