const OptimalCell = require("../models/OptimalCell");

function cellSplit(cell, xd = 2, yd = 2) {
  let top_right_lat = cell.getTopRightLat();
  let top_right_lng = cell.getTopRightLng();
  let bottom_left_lat = cell.getBottomLeftLat();
  let bottom_left_lng = cell.getBottomLeftLng();

  const x = top_right_lng - bottom_left_lng;
  const y = top_right_lat - bottom_left_lat;

  xd = xd || 1;
  yd = yd || 1;

  const xstep = x / xd;
  const ystep = y / yd;

  const cells = [];

  let k = 1;
  for (let i = 0; i < xd; i++) {
    for (let j = 0; j < yd; j++) {
      const newTopRightLat = bottom_left_lat + (j + 1) * ystep;
      const newTopRightLng = bottom_left_lng + (i + 1) * xstep;
      const newBottomLeftLat = bottom_left_lat + j * ystep;
      const newBottomLeftLng = bottom_left_lng + i * xstep;

      const cellObj = new OptimalCell()
        .setTopRight(newTopRightLat, newTopRightLng)
        .setBottomLeft(newBottomLeftLat, newBottomLeftLng)
        .setCountry(cell.getCountry())
        .setCellSize(cell.getCellSize())
        .setId();

      cells.push(cellObj);
      k++;
    }
  }

  return cells;
}

module.exports = {
  cellSplit,
};
