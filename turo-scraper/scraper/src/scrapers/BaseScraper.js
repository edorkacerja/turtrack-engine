const puppeteer = require("puppeteer");
const Xvfb = require('xvfb');
const {getRandomInt, sleep} = require("../utils/utils");

class BaseScraper {
  static instances = new Map();
  static type = "base";

  bytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  constructor(config) {
    const { proxyAuth, proxyServer, delay, headless, instanceId } = config;

    this.proxyAuth = proxyAuth || "intellicode:T3yGrF8Nr63U7q8m";
    this.proxyServer = proxyServer || "https://proxy.packetstream.io:31111";
    this.delay = delay || 1100;
    this.headless = headless ?? false;
    this.instanceId = instanceId || 'unknown';

    this.browser = null;
    this.page = null;

    this.running = true;
    this.currentRequestTotalBytes = 0;
    this.maxDataLimit = 0.01 * 1024 * 1024; // 1KB limit for testing
  }

  async init() {
    try {
      const args = ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"];

      if (this.proxyServer) args.push(`--proxy-server=${this.proxyServer}`);

      if(!this.headless) {
        const xvfb = new Xvfb({
          silent: true,
          xvfb_args: ["-screen", "0", '1280x720x24', "-ac"],
        });

        xvfb.startSync();
      }

      this.browser = await puppeteer.launch({
        headless: this.headless,
        args,
      });

      this.page = await this.browser.newPage();

      if (this.proxyAuth?.includes(":")) {
        const [username, password] = this.proxyAuth.split(":");

        await this.page.authenticate({
          username,
          password,
        });
      }

      await this.page.setRequestInterception(true);

      this.page.on("request", (request) => {
        if (this.currentRequestTotalBytes >= this.maxDataLimit) {
          request.abort();
        } else if (request.resourceType() === "image" || request.resourceType() === "media") {
          request.abort();
        } else {
          request.continue();
        }
      });

      this.page.on('response', async response => {
        const request = response.request();
        const url = request.url();

        let responseSize = 0;
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          responseSize = parseInt(contentLength, 10);
        } else {
          try {
            const buffer = await response.buffer();
            responseSize = buffer.length;
          } catch (error) {
            console.error(`[Instance ${this.instanceId}] Error getting response size for ${url}:`, error.message);
          }
        }

        if (this.currentRequestTotalBytes + responseSize > this.maxDataLimit) {
          responseSize = this.maxDataLimit - this.currentRequestTotalBytes;
          console.warn(`[Instance ${this.instanceId}] Data limit reached for ${url}. Truncating response.`);
        }

        this.currentRequestTotalBytes += responseSize;

        if (!response.ok()) {
          console.error(`[Instance ${this.instanceId}] Failed request to ${url}: ${response.status()} ${response.statusText()}. Data received: ${responseSize} Bytes`);
        }
      });

      await this.logRequestSizes("https://www.turo.com");

      const sleepDuration = getRandomInt(1, 2) * 1000;
      console.log(`Sleeping for ${sleepDuration / 1000} seconds`);
      await sleep(sleepDuration);

      BaseScraper.instances.set(this, true);
    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Failed to initialize scraper: ${error.message}`);
      throw error;
    }
  }

  async logRequestSizes(url) {
    console.log(`[Instance ${this.instanceId}] Starting request to ${url}`);

    this.currentRequestTotalBytes = 0;

    try {
      await this.page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000, // 60 seconds timeout
      });
    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Error navigating to ${url}: ${error.message}`);
    }

    console.log(`[Instance ${this.instanceId}] Total data received for ${url}: ${this.currentRequestTotalBytes} Bytes`);
    if (this.currentRequestTotalBytes >= this.maxDataLimit) {
      // console.warn(`[Instance ${this.instanceId}] Data limit reached for ${url}. Received: ${this.bytesToMB(this.currentRequestTotalBytes)} MB, Limit: ${this.bytesToMB(this.maxDataLimit)} MB`);
    }
  }

  async logIpAddress() {
    try {
      const ipAddress = await this.page.evaluate(async () => {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      });
      console.log(`[Instance ${this.instanceId}] Current IP address: ${ipAddress}`);
    } catch (error) {
      console.warn(`[Instance ${this.instanceId}] Failed to fetch the IP address: ${error.message}`);
    }
  }

  isRunning() {
    return this.running;
  }

  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.running = false;
        BaseScraper.instances.delete(this);
        console.log(`[Instance ${this.instanceId}] Scraper closed`);
      }
    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Error closing browser: ${error.message}`);
    }
  }

  static async close() {
    try {
      for (const instance of BaseScraper.instances.keys()) {
        await instance.close();
      }
    } catch (error) {
      console.error(`Error closing all browser instances: ${error.message}`);
    }
  }
}

module.exports = BaseScraper;