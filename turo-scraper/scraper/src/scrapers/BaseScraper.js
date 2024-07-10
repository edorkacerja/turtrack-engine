const puppeteer = require("puppeteer");
const Xvfb = require('xvfb');

class BaseScraper {
  static instances = new Map();
  static type = "base";

  constructor(config) {
    const { proxyAuth, proxyServer, delay, headless } = config;

    this.proxyAuth = proxyAuth;
    this.proxyServer = proxyServer;
    this.delay = delay;
    this.headless = headless;

    this.browser = null;
    this.page = null;

    this.running = true;
  }

  async init() {
    const args = ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"];

    if (this.proxyServer) args.push(`--proxy-server=${this.proxyServer}`);

    if(!this.headless) {
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

    await page.setRequestInterception(true);

    page.on("request", (request) => {
      if (request.resourceType() === "image" || request.resourceType() === "media") request.abort();
      else request.continue();
    });

    await page.goto("https://www.turo.com");

    this.browser = browser;
    this.page = page;

    BaseScraper.instances.set(this, true);
  }

  isRunning() {
    return this.running;
  }

  async close() {
    try {
      await this.browser.close();
      this.running = false;
      BaseScraper.instances.delete(this);
    } catch (error) {
      console.error("Error closing browser", error);
    }
  }

  static async close() {
    try {
      for (const instance of BaseScraper.instances.keys()) {
        await instance.browser.close();

        instance.running = false;
        BaseScraper.instances.delete(instance);
      }
    } catch (error) {
      console.error("Error closing browser", error);
    }
  }
}

module.exports = BaseScraper;
