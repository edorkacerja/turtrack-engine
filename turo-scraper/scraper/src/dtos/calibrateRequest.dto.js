class CalibrateRequest {
  constructor(config) {
    if (!config?.country) throw new Error("Country is required");
    this.country = config?.country ?? null;
    this.cellSize = config?.cellSize ?? 1;
  }
}

module.exports = CalibrateRequest;
