const puppeteer = require("puppeteer");
const Xvfb = require('xvfb');
const {getRandomInt, sleep} = require("../utils/utils");

class BaseScraper {
  static instances = new Map();
  static type = "base";

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
        if (request.resourceType() === "image" || request.resourceType() === "media") request.abort();
        else request.continue();
      });

      await this.page.goto("https://www.turo.com");

      const sleepDuration = getRandomInt(1, 2) * 1000; // Convert to milliseconds

      console.log(`Sleeping for ${sleepDuration / 1000} seconds`);
      await sleep(sleepDuration);


      BaseScraper.instances.set(this, true);
    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Failed to initialize scraper: ${error.message}`);
      throw error;
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