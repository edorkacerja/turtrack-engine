const BaseScraperRequest = require("./BaseScraperRequest.js");

class SearchRequest extends BaseScraperRequest {
  constructor(config) {
    super(config);

    this.startAt = config?.startAt ?? 0;
    this.limit = config?.limit ?? Infinity;
    this.divider = config?.divider ?? 2;
    this.recursiveDepth = config?.recursiveDepth ?? 9999;

    this.cellSize = config?.cellSize ?? 1;

    this.sorts = {
      direction: config?.sorts?.direction ?? "ASC",
      type: config?.sorts?.type ?? "DISTANCE",
    };

    this.filters = {
      engines: config?.filters?.engines ?? [],
      makes: config?.filters?.makes ?? [],
      models: config?.filters?.models ?? [],
      tmvTiers: config?.filters?.tmvTiers ?? [],
      features: config?.filters?.features ?? [],
      types: config?.filters?.types ?? [],
    };
  }
}

module.exports = SearchRequest;
