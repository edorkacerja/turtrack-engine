class BaseScraperRequest {
  constructor(config) {
    this.proxyServer = config?.proxyServer ?? "https://proxy.packetstream.io:31111";
    this.proxyAuth = config?.proxyAuth ?? "intellicode:T3yGrF8Nr63U7q8m";
    this.headless = config?.headless ?? false;
    this.maxFailedInRow = config?.maxFailedInRow ?? 10;

    this.compression = {
      compress: config?.compression?.compress ?? false,
      removeOld: config?.compression?.removeOld ?? false,
    };

    this.ignoreLastUpdated = config?.ignoreLastUpdated ?? false;

    // an array, local
    this.resource = config?.resource ?? "local";

    // additional fields
    this.createdAt = new Date();

    // required fields validation
    if (!config?.country) throw new Error("country is required");

    this.country = config?.country?.toUpperCase();

    // Method to generate random delay
    this.getRandomDelay = () => {
      return Math.random() * (1200 - 1100) + 1100; // Random number between 1100 and 1200 ms
    };

    // Initial delay value
    this.delay = this.getRandomDelay();
  }

  // Method to update delay before each request
  updateDelay() {
    this.delay = this.getRandomDelay();
  }
}

module.exports = BaseScraperRequest;