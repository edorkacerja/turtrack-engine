const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const Xvfb = require('xvfb');
const {getRandomInt, sleep} = require("../utils/utils");
const {PROXY_AUTH, PROXY_SERVER} = require("../utils/constants");

class BaseScraper {
  static type = "base";

  bytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  constructor(config) {
    const { proxyAuth, proxyServer, delay, headless, instanceId } = config;

    this.proxyAuth = proxyAuth || PROXY_AUTH;
    this.proxyServer = proxyServer || PROXY_SERVER;
    this.delay = delay || 1100;
    this.headless = headless ?? false;
    this.instanceId = instanceId || 'unknown';

    this.browser = null;
    this.page = null;

    this.running = true;
    this.currentRequestTotalBytes = 0;
    this.maxDataLimit = 0.01 * 1024 * 1024; // 1KB limit for testing

    // Store references to event listeners
    this.requestListener = null;
    this.responseListener = null;
  }

  async init() {
    try {
      const args = ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"];

      if (this.proxyServer) args.push(`--proxy-server=${this.proxyServer}`);

      if(!this.headless) {
        this.xvfb = new Xvfb({
          silent: true,
          xvfb_args: ["-screen", "0", '1280x720x24', "-ac"],
        });

        this.xvfb.startSync();
      }

      this.browser = await puppeteer.launch({
        headless: this.headless,
        args,
      });

      const [page] = await this.browser.pages();
      this.page = page;


      if (this.proxyAuth?.includes(":")) {
        const [username, password] = this.proxyAuth.split(":");

        await this.page.authenticate({
          username,
          password,
        });
      }

      await this.page.setRequestInterception(true);

      this.requestListener = (request) => {
        if (this.currentRequestTotalBytes >= this.maxDataLimit) {
          request.abort();
        } else if (request.resourceType() === "image" || request.resourceType() === "media" ||
            request.resourceType() === "font" || request.resourceType() === "stylesheet" ||
            request.resourceType() === "script" || request.resourceType() === "xhr") {
          request.abort();
        } else if (request.url().endsWith(".png") || request.url().includes("base64")) {
          request.abort();
        } else {
          request.continue();
        }
      };

      this.responseListener = async (response) => {
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
      };

      this.page.on("request", this.requestListener);
      this.page.on('response', this.responseListener);

      await this.logRequestSizes("https://www.turo.com");

      const sleepDuration = getRandomInt(1, 2) * 1000;
      console.log(`Sleeping for ${sleepDuration / 1000} seconds`);
      await sleep(sleepDuration);

    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Failed to initialize scraper: ${error.message}`);
      await this.destroy();
      throw error;
    }
  }

  async logRequestSizes(url) {
    console.log(`[Instance ${this.instanceId}] Starting request to ${url}`);

    this.currentRequestTotalBytes = 0;

    try {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
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

  async destroy() {
    console.log(`[Instance ${this.instanceId}] Destroying scraper instance...`);

    try {
      // Remove specific listeners
      if (this.page) {
        try {
          // Use removeListener if available, otherwise fall back to off
          if (typeof this.page.removeListener === 'function') {
            this.page.removeListener("request", this.requestListener);
            this.page.removeListener("response", this.responseListener);
          } else if (typeof this.page.off === 'function') {
            this.page.off("request", this.requestListener);
            this.page.off("response", this.responseListener);
          } else {
            console.warn(`[Instance ${this.instanceId}] Unable to remove listeners: method not available`);
          }

        } catch (pageError) {
          console.error(`[Instance ${this.instanceId}] Error during page cleanup: ${pageError.message}`);
        }
      }
      // Close all pages
      if (this.browser) {
        const pages = await this.browser.pages().catch(e => {
          console.error(`[Instance ${this.instanceId}] Error getting browser pages: ${e.message}`);
          return [];
        });

        await Promise.all(pages.map(page =>
            page.close().catch(e => console.error(`[Instance ${this.instanceId}] Error closing page: ${e.message}`))
        ));
      }

    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Error during page cleanup: ${error.message}`);
    } finally {
      // Ensure browser is closed even if there were errors during page closure
      await this.closeBrowserWithFallback();

      // Stop Xvfb if it was started
      if (!this.headless && this.xvfb) {
        try {
          this.xvfb.stopSync();
        } catch (error) {
          console.error(`[Instance ${this.instanceId}] Error stopping Xvfb: ${error.message}`);
        } finally {
          this.xvfb = null;
        }
      }

      this.running = false;
      this.page = null;
      this.browser = null;
      console.log(`[Instance ${this.instanceId}] Scraper instance destroyed.`);
    }
  }

  async closeBrowserWithFallback() {
    try {
      console.log(`[Instance ${this.instanceId}] Attempting to close browser...`);
      if (this.browser) {
        await this.browser.close();
        console.log(`[Instance ${this.instanceId}] Browser closed successfully.`);
      }
    } catch (error) {
      console.error(`[Instance ${this.instanceId}] Error during browser.close(): ${error.message}`);
    } finally {
      if (this.browser && this.browser.process() != null) {
        console.log(`[Instance ${this.instanceId}] Forcibly killing the browser process...`);
        try {
          this.browser.process().kill('SIGKILL');
        } catch (killError) {
          console.error(`[Instance ${this.instanceId}] Error killing browser process: ${killError.message}`);
        }
      }
      this.browser = null;
    }
  }

  async close() {
    await this.destroy();
  }
}

module.exports = BaseScraper;