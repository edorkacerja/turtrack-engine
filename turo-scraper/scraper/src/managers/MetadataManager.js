const path = require("path");
const parser = require("fast-csv");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");

const Vehicle = require("../models/Vehicle");
const BaseCell = require("../models/BaseCell");

const MetadataManager = {
  metadata: {},

  readFiles: {
    vehicles: "vehicles.csv",
    baseGrid: "base_grid.csv",
  },

  writeFiles: {
    vehicles: "vehicles.csv",
    baseGrid: "base_grid.csv",
    optimalGrid: "optimal_grid.csv",
  },

  root: path.join(__dirname, "..", ".."),

  metadataHash: uuidv4(),

  init() {
    this.metadata.optimalGrid = new Map();
    this.metadata.vehicles = new Map();
    this.metadata.baseGrid = new Map();

    this.read();
  },

  addVehicle(vehicle) {
    const vehicles = this.metadata.vehicles;

    if (vehicles.has(vehicle.id)) return;

    vehicles.set(vehicle.id, vehicle);
  },

  addOptimalCell(cell) {
    const optimalGrid = this.metadata.optimalGrid;

    if (optimalGrid.has(cell.id)) return;

    optimalGrid.set(cell.id, cell);
  },

  addBaseCell(cell) {
    const baseGrid = this.metadata.baseGrid;

    if (baseGrid.has(cell.id)) return;

    baseGrid.set(cell.id, cell);
  },

  getVehicles(filterFn) {
    const vehicles = Array.from(this.metadata.vehicles.values());

    if (filterFn) return vehicles.filter(filterFn);

    return vehicles;
  },

  getBaseCells(filterFn) {
    const cells = Array.from(this.metadata.baseGrid.values());

    if (filterFn) return cells.filter(filterFn);

    return cells;
  },

  async updateHash() {
    this.metadataHash = uuidv4();

    const filepath = path.join(this.root, `/database/metadata/metadata_hash.txt`);
    await fs.writeFile(filepath, this.metadataHash)
  },

  read() {
    const files = this.readFiles;

    const options = {
      headers: true,
      ignoreEmpty: true,
      trim: true,
    };

    const metadata = this.metadata;

    for (const key in files) {
      const filepath = path.join(this.root, `/database/metadata/${files[key]}`);
      if (!fs.existsSync(filepath)) continue;

      metadata[key] = new Map();

      parser
        .parseFile(filepath, options)
        .on("error", (error) => console.log(error))
        .on("data", handleRow)
        .on("end", () => {
          console.log(`Done reading ${key}.`);
        });

      function handleRow(row) {
        switch (key) {
          case "vehicles":
            const vehicle = new Vehicle()
              .setId(row.id)
              .setCountry(row.country)
              .setCellId(row.cell_id)
              .setSearchLastUpdated(row.search_last_updated)
              .setPricingLastUpdated(row.pricing_last_updated)
              .setDetailLastUpdated(row.detail_last_updated);

            metadata[key].set(vehicle.id, vehicle);
            break;
          case "baseGrid":
            const cell = new BaseCell()
              .setCountry(row.country)
              .setCellSize(row.cell_size)
              .setTopRight(row.top_right_lat, row.top_right_lng)
              .setBottomLeft(row.bottom_left_lat, row.bottom_left_lng)
              .setSearchLastUpdated(row.search_last_updated)
              .setId(row.id);

            metadata[key].set(cell.id, cell);
            break;
        }
      }
    }
  },

  write() {
    const files = this.writeFiles;

    for (const key in files) {
      const filepath = path.join(this.root, `/database/metadata/${files[key]}`);

      const rows = [];
      const metadata = this.metadata[key];

      const first = metadata.values().next().value;
      if (!first) continue;

      rows.push(first.getHeaders());
      rows.push(first.getRow());

      for (const item of metadata.values()) rows.push(item.getRow());

      const options = {
        headers: true,
        ignoreEmpty: true,
      };

      parser
        .writeToPath(filepath, rows, options)
        .on("error", (err) => console.error(err))
        .on("finish", () => console.log("Done writing."));
    }
  },

  sync(milliseconds) {
    let hash = this.metadataHash;
    setInterval(() => {
      if (this.metadataHash !== hash) {
        this.write();
        hash = this.metadataHash;
      }
    }, milliseconds);
  },

  reset() {
    this.metadata = {};
    this.init();
  }
};

module.exports = MetadataManager;
