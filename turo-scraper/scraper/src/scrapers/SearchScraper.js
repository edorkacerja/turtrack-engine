const fetch = require("cross-fetch");
const utils = require("../utils/utils");
const cellutil = require("../utils/cellutil");
const BaseScraper = require("./BaseScraper");
const OptimalCell = require("../models/OptimalCell");

class SearchScraper extends BaseScraper {
  static type = "search";

  constructor(config) {
    super(config);

    const { divider, recursiveDepth, country, sorts, filters } = config;

    this.divider = divider;
    this.recursiveDepth = recursiveDepth;
    this.country = country;
    this.filters = filters;
    this.sorts = sorts;

    this.optimalCells = [];
    this.scraped = [];

    this.localResourceName = `${country}.base-grid`;

    this.onSuccessCallback = () => {};
    this.onFailedCallback = () => {};
    this.onFinishCallback = () => {};
  }

  async scrape(cells) {
    const promises = [];
    for (let cell of cells) {
      if (!this.isRunning()) break;

      console.log(`Scraping cell with id: ${cell.id}`);
      const promise = this.fetch(cell);
      promises.push(promise);
      await utils.sleep(this.delay);
    }

    await Promise.allSettled(promises);
    this.onFinishCallback();
  }

  async fetch(cell) {
    const baseCell = cell;

    const recursiveFetch = async (cell, depth = 0) => {
      if (!this.isRunning()) return;

      const headers = {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
      };

      const reqBody = {
        filters: {
          location: {
            country: this.country,
            type: "boundingbox",
            bottomLeft: {
              lat: cell.getBottomLeftLat(),
              lng: cell.getBottomLeftLng(),
            },
            topRight: {
              lat: cell.getTopRightLat(),
              lng: cell.getTopRightLng(),
            },
          },
          engines: this.filters.engines,
          makes: this.filters.makes,
          models: this.filters.models,
          tmvTiers: this.filters.tmvTiers,
          features: this.filters.features,
          types: this.filters.types,
        },
        sorts: {
          direction: this.sorts.direction,
          type: this.sorts.type,
        },
      };

      const requestConfig = {
        headers,
        body: JSON.stringify(reqBody),
        method: "POST",
        mode: "cors",
        credentials: "include",
      };

      const url = "https://turo.com/api/v2/search";

      let data = null;

      try {
        data = await this.page.evaluate(
          ({ requestConfig, url }) => fetch(url, requestConfig).then((res) => res.json()),
          { requestConfig, url }
        );
      } catch {}

      if (!data?.vehicles) {
        this.onFailedCallback({ optimalCell: cell, baseCell, scraped: null });
        return;
      }

      const vehiclesLength = data.vehicles.length;

      const isSearchRadiusZero = data?.searchLocation?.appliedRadius?.value === 0;
      const isDepthExceeded = depth > this.recursiveDepth;

      if (vehiclesLength < 200 || isSearchRadiusZero || isDepthExceeded) {
        cell.setVehicleCount(vehiclesLength);

        this.onSuccessCallback({
          baseCell,
          optimalCell: cell,
          scraped: data,
        });

        return;
      }

      const cells = cellutil.cellSplit(cell, this.divider, this.divider);
      for (let minicell of cells) await recursiveFetch(minicell, depth + 1);
    };

    await recursiveFetch(cell);
  }

  async onSuccess(callfunction) {
    this.onSuccessCallback = callfunction;
    return this;
  }

  async onFailed(callfunction) {
    this.onFailedCallback = callfunction;
    return this;
  }

  async onFinish(callfunction) {
    this.onFinishCallback = callfunction;
    return this;
  }
}

module.exports = SearchScraper;
