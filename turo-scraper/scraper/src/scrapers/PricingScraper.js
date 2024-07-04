const fetch = require("cross-fetch");
const utils = require("../utils/utils");
const BaseScraper = require("./BaseScraper");

class PricingScraper extends BaseScraper {
  static type = "pricing";

  constructor(config) {
    super(config);

    const { startDate, endDate, country } = config;

    this.startDate = startDate;
    this.endDate = endDate;

    this.localResourceName = `${country}.vehicles`;

    this.onSuccessCallback = () => {};
    this.onFailedCallback = () => {};
    this.onFinishCallback = () => {};
  }

  async scrape(vehicles) {
    const promises = [];
    for (let vehicle of vehicles) {
      if (!this.isRunning()) break;

      const vehicleId = vehicle.getId();

      const promise = this.fetch(vehicleId)
        .then((data) => {
          this.onSuccessCallback({
            id: vehicleId,
            vehicle,
            scraped: data,
          });
        })
        .catch((error) => {
          this.onFailedCallback({ vehicle });
          console.log(error);
        });

      promises.push(promise);
      await utils.sleep(this.delay);
    }

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

    const queryParams = new URLSearchParams();
    queryParams.append("end", this.endDate);
    queryParams.append("start", this.startDate);
    queryParams.append("vehicleId", vehicleId);

    const url = `https://turo.com/api/vehicle/daily_pricing?${queryParams.toString()}`;

    const data = await this.page.evaluate(
      ({ requestConfig, url }) => fetch(url, requestConfig).then((res) => res.json()),
      { requestConfig, url }
    );

    return data;
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
