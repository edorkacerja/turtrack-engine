class ResetRequestDTO {
  constructor(config) {
    // search, vehicle_detail, pricing, shared_old, shared, all
    if (!config?.type) throw new Error("type is required");
    this.type = config?.type;
  }
}

module.exports = ResetRequestDTO;
