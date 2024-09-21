const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const Xvfb = require('xvfb');
const fetch = require("cross-fetch");
const utils = require("../utils/utils");
const cellutil = require("../utils/cellutil");
const { sleep } = require("../utils/utils");
const {PROXY_AUTH, PROXY_SERVER} = require("../utils/constants");

class SearchScraper {
  static instances = new Map();
  static type = "search";

  constructor(config) {
    const { instanceId, proxyAuth, proxyServer, delay, headless, divider, recursiveDepth, country, sorts, filters } = config;

    this.instanceId = instanceId || 'unknown';
    this.proxyAuth = proxyAuth || PROXY_AUTH;
    this.proxyServer = proxyServer || PROXY_SERVER;
    this.delay = delay || 1100;
    this.headless = headless ?? false;
    this.divider = divider || 2;
    this.recursiveDepth = recursiveDepth || 10;
    this.country = country || "US";
    this.filters = filters || {};
    this.sorts = sorts || {};

    this.browser = null;
    this.page = null;
    this.running = true;

    this.optimalCells = [];
    this.scraped = [];
    this.localResourceName = `${country}.base-grid`;

    this.onSuccessCallback = () => { };
    this.onFailedCallback = () => { };
    this.onFinishCallback = () => { };
  }

  async init() {
    const args = ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"];

    if (this.proxyServer) args.push(`--proxy-server=${this.proxyServer}`);

    if (!this.headless) {
      const xvfb = new Xvfb({
        silent: true,
        xvfb_args: ["-screen", "0", '1280x720x24', "-ac"],
      });

      xvfb.startSync();
    }

    const browser = await puppeteer.launch({
      headless: this.headless,
      args,
    });

    const page = await browser.newPage();

    if (this.proxyAuth?.includes(":")) {
      const [username, password] = this.proxyAuth.split(":");

      await page.authenticate({
        username,
        password,
      });
    }

    // Set the User Agent at the page level
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
      'Mozilla/5.0 (X11; Linux x86_64)...'
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(userAgent);

    // Set viewport size
    await page.setViewport({ width: 1280, height: 720 });

    // Remove request interception
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      if (request.resourceType() === "image" || request.resourceType() === "media") request.abort();
      else request.continue();
    });

    await page.goto("https://www.turo.com");

    this.browser = browser;
    this.page = page;

    SearchScraper.instances.set(this, true);
  }

  isRunning() {
    return this.running;
  }

  async close() {
    try {
      await this.browser.close();
      this.running = false;
      SearchScraper.instances.delete(this);
    } catch (error) {
      console.error("Error closing browser", error);
    }
  }

  static async closeAll() {
    try {
      for (const instance of SearchScraper.instances.keys()) {
        await instance.browser.close();
        instance.running = false;
        SearchScraper.instances.delete(instance);
      }
    } catch (error) {
      console.error("Error closing browsers", error);
    }
  }

  async scrape(cells) {
    for (let cell of cells) {
      if (!this.isRunning()) break;

      console.log(`[${this.instanceId}] Scraping cell with id: ${cell.id}`);
      await this.fetch(cell);
      await sleep(this.delay);
    }

    this.onFinishCallback();
  }

  async fetch(cell) {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
      'Mozilla/5.0 (X11; Linux x86_64)...'
    ];

    const baseCell = cell;
    const maxRetries = 3;

    const recursiveFetch = async (cell, depth = 0, retryCount = 0) => {
      if (!this.isRunning()) return;

      const headers = {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        // Remove 'User-Agent' from headers
        // "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)]
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
            async ({ requestConfig, url }) => {
              const response = await fetch(url, requestConfig);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return await response.json();
            },
            { requestConfig, url }
        );
        console.log(`[${this.instanceId}] Received data for cell: ${JSON.stringify(cell)}`);
        console.log(JSON.stringify(data));
      } catch (e) {
        console.error(`[${this.instanceId}] Error fetching data for cell: ${JSON.stringify(cell)}`, e);

        if (retryCount < maxRetries) {
          const delay = Math.floor(Math.random() * 2000) + 1000; // Random delay between 1-3 seconds
          console.log(`[${this.instanceId}] Retrying fetch for cell: ${JSON.stringify(cell)}. Attempt ${retryCount + 1} of ${maxRetries}. Waiting ${delay}ms.`);
          await utils.sleep(delay);
          return await recursiveFetch(cell, depth, retryCount + 1);
        }

        this.onFailedCallback({ optimalCell: cell, baseCell, scraped: null, error: e.message });
        return;
      }

      if (!data?.vehicles) {
        console.warn(`[${this.instanceId}] No vehicles data for cell: ${JSON.stringify(cell)}`);
        this.onFailedCallback({ optimalCell: cell, baseCell, scraped: null, error: "No vehicles data" });
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

        // Add a random delay between successful requests
        const successDelay = Math.floor(Math.random() * 2000) + 1000;
        await utils.sleep(successDelay);

        return;
      }

      const cells = cellutil.cellSplit(cell, this.divider, this.divider);
      for (let minicell of cells) {
        await recursiveFetch(minicell, depth + 1);

        // Add a small random delay between recursive calls
        const recursiveDelay = Math.floor(Math.random() * 1000) + 500;
        await utils.sleep(recursiveDelay);
      }
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
