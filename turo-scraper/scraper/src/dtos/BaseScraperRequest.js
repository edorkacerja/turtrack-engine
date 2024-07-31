class BaseScraperRequest {
  constructor(config) {
    this.proxyServer = config?.proxyServer ?? "https://proxy.packetstream.io:31111";
    this.proxyAuth = config?.proxyAuth ?? "edorkacerja:ClHNrQ0x7l72DGZv";
    this.delay = config?.delay ?? 1100;
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
