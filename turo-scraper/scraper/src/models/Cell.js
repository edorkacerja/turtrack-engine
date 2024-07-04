const geohash = require("ngeohash");

class Cell {
  constructor() {
    this.id = null;
    this.country = null;
    this.cellSize = null;
    this.vehicleCount = null;
    this.topRightLat = null;
    this.topRightLng = null;
    this.bottomLeftLat = null;
    this.bottomLeftLng = null;
    this.searchLastUpdated = null;
    this.status = "success";
  }

  setCountry(country) {
    this.country = country;
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  setTopRight(top_right_lat, top_right_lng) {
    this.topRightLat = Number(top_right_lat);
    this.topRightLng = Number(top_right_lng);
    return this;
  }

  setBottomLeft(bottom_left_lat, bottom_left_lng) {
    this.bottomLeftLat = Number(bottom_left_lat);
    this.bottomLeftLng = Number(bottom_left_lng);
    return this;
  }

  setTopRightLat(top_right_lat) {
    this.topRightLat = Number(top_right_lat);
    return this;
  }

  setTopRightLng(top_right_lng) {
    this.topRightLng = Number(top_right_lng);
    return this;
  }

  setBottomLeftLat(bottom_left_lat) {
    this.bottomLeftLat = Number(bottom_left_lat);
    return this;
  }

  setBottomLeftLng(bottom_left_lng) {
    this.bottomLeftLng = Number(bottom_left_lng);
    return this;
  }

  setCellSize(cell_size) {
    this.cellSize = Number(cell_size);
    return this;
  }

  setId(id) {
    this.id = id ?? this.generateId();
    return this;
  }

  setSearchLastUpdated(search_last_updated) {
    this.searchLastUpdated = search_last_updated;
    return this;
  }

  setVehicleCount(vehicle_count) {
    this.vehicleCount = Number(vehicle_count);
    return this;
  }

  getId() {
    return this.id;
  }

  getCountry() {
    return this.country;
  }

  getStatus() {
    return this.status;
  }

  isFailed() {
    return this.status === "failed";
  }

  getCellSize() {
    return this.cellSize;
  }

  getTopRight() {
    return { lat: this.topRightLat, lng: this.topRightLng };
  }

  getTopRightLat() {
    return this.topRightLat;
  }

  getTopRightLng() {
    return this.topRightLng;
  }

  getBottomLeft() {
    return { lat: this.bottomLeftLat, lng: this.bottomLeftLng };
  }

  getBottomLeftLat() {
    return this.bottomLeftLat;
  }

  getBottomLeftLng() {
    return this.bottomLeftLng;
  }

  getSearchLastUpdated() {
    return this.searchLastUpdated;
  }

  getVehicleCount() {
    return this.vehicleCount;
  }

  generateId() {
    let topcode = geohash.encode(this.topRightLat, this.topRightLng, 9);
    let bottomcode = geohash.encode(this.bottomLeftLat, this.bottomLeftLng, 9);

    return `${topcode}.${bottomcode}`;
  }

  build() {
    return { ...this };
  }
}

module.exports = Cell;
