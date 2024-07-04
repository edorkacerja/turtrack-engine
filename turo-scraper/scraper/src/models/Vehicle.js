class Vehicle {
  constructor() {
    this.id = null;
    this.country = null;
    this.cellId = null;
    this.pricingLastUpdated = null;
    this.searchLastUpdated = null;
    this.detailLastUpdated = null;
    this.status = "success";
  }

  setId(id) {
    if (!id) throw new Error("vehicle id is required.");
    this.id = id;
    return this;
  }

  setCountry(country) {
    this.country = country;
    return this;
  }

  setCellId(cell_id) {
    this.cellId = cell_id;
    return this;
  }

  setPricingLastUpdated(pricing_last_updated) {
    this.pricingLastUpdated = pricing_last_updated;
    return this;
  }

  setSearchLastUpdated(search_last_updated) {
    this.searchLastUpdated = search_last_updated;
    return this;
  }

  setDetailLastUpdated(detail_last_updated) {
    this.detailLastUpdated = detail_last_updated;
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  getId() {
    return this.id;
  }

  getCountry() {
    return this.country;
  }

  getCellId() {
    return this.cellId;
  }

  getPricingLastUpdated() {
    return this.pricingLastUpdated;
  }

  getSearchLastUpdated() {
    return this.searchLastUpdated;
  }

  getDetailLastUpdated() {
    return this.detailLastUpdated;
  }

  getStatus() {
    return this.status;
  }

  getHeaders() {
    return [
      "id",
      "cell_id",
      "country",
      "status",
      "pricing_last_updated",
      "search_last_updated",
      "detail_last_updated",
    ];
  }

  getRow() {
    return [
      this.id,
      this.cellId,
      this.country,
      this.status,
      this.pricingLastUpdated,
      this.searchLastUpdated,
      this.detailLastUpdated,
    ];
  }
}

module.exports = Vehicle;
