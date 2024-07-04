const Cell = require("./Cell");

class OptimalCell extends Cell {
  constructor(cell) {
    super();

    Object.assign(this, cell)
  }

  getHeaders() {
    return [
      "id",
      "country",
      "base_cell_size",
      "vehicle_count",
      "status",
      "top_right_lat",
      "top_right_lng",
      "bottom_left_lat",
      "bottom_left_lng",
      "search_last_updated",
    ];
  }

  getRow() {
    return [
      this.id,
      this.country,
      this.cellSize,
      this.vehicleCount,
      this.status,
      this.topRightLat,
      this.topRightLng,
      this.bottomLeftLat,
      this.bottomLeftLng,
      this.searchLastUpdated,
    ];
  }
}

module.exports = OptimalCell;
