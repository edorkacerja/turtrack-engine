const Cell = require("./Cell");

class BaseCell extends Cell {
  constructor(cell) {
    super();

    Object.assign(this, cell)
  }

  getHeaders() {
    return [
      "id",
      "country",
      "cell_size",
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
      this.status,
      this.topRightLat,
      this.topRightLng,
      this.bottomLeftLat,
      this.bottomLeftLng,
      this.searchLastUpdated,
    ];
  }
}

module.exports = BaseCell;
