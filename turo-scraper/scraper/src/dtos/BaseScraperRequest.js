class BaseScraperRequest {
  constructor(config) {
    this.proxyServer = config?.proxyServer ?? null;
    this.proxyAuth = config?.proxyAuth ?? null;
    this.delay = config?.delay ?? 0;
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
  }
}

module.exports = BaseScraperRequest;
