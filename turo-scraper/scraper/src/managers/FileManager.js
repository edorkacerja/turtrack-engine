const fs = require("fs-extra");
const path = require("path");
const dateutil = require("../utils/dateutil");

class FileManager {
  static databasePath = path.join(__dirname, "..", "..", "database");
  static dataPath = path.join(this.databasePath, "data");

  constructor(type) {
    this.type = type;
    this.databasePath = FileManager.databasePath;
    this.dataPath = FileManager.dataPath;
    this.timestamp = dateutil.now();
  }

  async write(name, data) {
    const filePath = path.join(this.dataPath, this.type, this.timestamp, `${name}.json`);
    return await fs.outputFile(filePath, JSON.stringify(data, null, 2));
  }

  static async clear(type) {
    let fpath = "";

    if (type === "all") fpath = FileManager.dataPath;
    else if (type === "search") fpath = path.join(FileManager.dataPath, "search");
    else if (type === "pricing") fpath = path.join(FileManager.dataPath, "pricing");
    else if (type === "vehicle_detail") fpath = path.join(FileManager.dataPath, "vehicle_detail");
    else return;

    return await fs.remove(fpath);
  }

  static async getSize() {
    const sizes = {};
    const root = path.join(__dirname, "..", "..");

    function calculateSize(currentPath) {
      const stats = fs.statSync(currentPath);
      let totalSize = 0;

      if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);

        files.forEach((file) => {
          const filePath = path.join(currentPath, file);
          totalSize += calculateSize(filePath);
        });
      } else {
        totalSize += stats.size;
      }

      if (stats.isDirectory()) {
        const dirname = path.relative(root, currentPath);
        const sizeInKB = (totalSize / 1024 ** 2).toFixed(2);
        sizes[dirname] = sizeInKB + " MB";
      }

      return totalSize;
    }

    calculateSize(FileManager.databasePath);
    return sizes;
  }
}

module.exports = FileManager;
