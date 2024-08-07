const fetch = require("cross-fetch");
const utils = require("../utils/utils");
const BaseScraper = require("./BaseScraper");
const VehicleDetailRequest = require("../dtos/vehicleDetailRequest.dto");

class VehicleDetailScraper extends BaseScraper {
  static type = "vehicle_detail";

  constructor(config) {
    super(config);

    const vehicleDetailRequest = new VehicleDetailRequest(config);

    this.startDate = vehicleDetailRequest.startDate;
    this.endDate = vehicleDetailRequest.endDate;
    this.startTime = vehicleDetailRequest.startTime;
    this.endTime = vehicleDetailRequest.endTime;

    this.localResourceName = `${config.country}.vehicles`;

    this.onSuccessCallback = () => {};
    this.onFailedCallback = () => {};
    this.onFinishCallback = () => {};
  }

  async scrape(vehicles) {
    const promises = vehicles.map(async (vehicle) => {
      if (!this.isRunning()) return;

      const vehicleId = vehicle.getId();

      try {
        const data = await this.fetch(vehicleId);
        this.onSuccessCallback({
          id: vehicleId,
          vehicle,
          scraped: data,
        });
      } catch (error) {
        this.onFailedCallback({ vehicle, error });
      } finally {
        await utils.sleep(this.delay);
      }
    });

    await Promise.allSettled(promises);
    this.onFinishCallback(this.scraped);
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

    const queryParams = new URLSearchParams({
      endDate: this.endDate,
      endTime: this.endTime,
      startDate: this.startDate,
      startTime: this.startTime,
      vehicleId: vehicleId,
    });

    const url = `https://turo.com/api/vehicle/detail?${queryParams.toString()}`;

    const response = await this.page.evaluate(
        async ({ requestConfig, url }) => {
          const res = await fetch(url, requestConfig);
          const data = await res.json();
          return { status: res.status, data };
        },
        { requestConfig, url }
    );

    if (response.status !== 200) {
      throw response.data;
    }

    return response.data;
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

module.exports = VehicleDetailScraper;