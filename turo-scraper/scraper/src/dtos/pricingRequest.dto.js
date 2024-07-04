const BaseScraperRequest = require("./BaseScraperRequest");

class PricingRequest extends BaseScraperRequest {
  constructor(config) {
    super(config);

    this.startDate = config?.startDate ?? null;
    this.endDate = config?.endDate ?? null;
    this.startAt = config?.startAt ?? 0;
    this.limit = config?.limit ?? Infinity;
  }
}

module.exports = PricingRequest;
