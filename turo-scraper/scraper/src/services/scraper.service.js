const fetch = require("cross-fetch");
const BaseScraper = require("../scrapers/BaseScraper");
const SearchScraper = require("../scrapers/SearchScraper");
const PricingScraper = require("../scrapers/PricingScraper");
const VehicleDetailScraper = require("../scrapers/VehicleDetailScraper");
const Vehicle = require("../models/Vehicle");
const FileManager = require("../managers/FileManager");
const MetadataManager = require("../managers/MetadataManager");
const { sendToKafka, disconnectProducer } = require("../utils/kafkaUtil");

const dateutil = require("../utils/dateutil");
const BaseCell = require("../models/BaseCell");
const OptimalCell = require("../models/OptimalCell");

const calibrateService = async (dto) => {
  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
  };

  const reqBody = {
    cell_size: dto.cellSize,
    country: dto.country,
  };

  const requestConfig = {
    headers,
    body: JSON.stringify(reqBody),
    method: "POST",
  };

  const url = "http://calibrator:5003/api/v1/calibrator/calibrate";

  let baseGrid = await fetch(url, requestConfig)
    .then((res) => res.json())
    .catch(console.log);

  for (let cell of baseGrid) {
    const cellObj = new BaseCell()
      .setTopRightLat(cell.top_right_coords.lat)
      .setTopRightLng(cell.top_right_coords.lng)
      .setBottomLeftLat(cell.bottom_left_coords.lat)
      .setBottomLeftLng(cell.bottom_left_coords.lng)
      .setCountry(dto.country)
      .setCellSize(cell.cell_size)
      .setId();

    MetadataManager.addBaseCell(cellObj);
  }

  MetadataManager.updateHash();

  return baseGrid;
};

const searchService = async (dto) => {
  const scraper = new SearchScraper(dto);
  const fileManager = new FileManager("search");

  let cells = MetadataManager.getBaseCells(filterFn);
  cells = cells.slice(dto.startAt, dto.limit);

  await scraper.init();

  scraper.onSuccess(handleSuccess);
  scraper.onFailed(handleFailed);
  scraper.onFinish(handleFinish);
  scraper.scrape(cells);

  let failedInRow = 0;

  function filterFn(cell) {
    if(cell.isFailed()) return true;

    return (
      cell.getCountry() === dto.country &&
      cell.getCellSize() === dto.cellSize &&
      (dto.ignoreLastUpdated || dateutil.isBeforeToday(cell.getSearchLastUpdated()))
    );
  }

  function handleSuccess(data) {
    let { baseCell, optimalCell, scraped } = data;

    optimalCell.setSearchLastUpdated(dateutil.now());
    baseCell.setSearchLastUpdated(dateutil.now());

    // make sure to change the class name to the correct one
    baseCell = new BaseCell(baseCell);
    optimalCell = new OptimalCell(optimalCell);

    MetadataManager.addOptimalCell(optimalCell);
    MetadataManager.addBaseCell(baseCell);

    const vehicles = scraped.vehicles;

    for (let vehicle of vehicles) {
      const vehicleObj = new Vehicle()
        .setId(vehicle.id)
        .setCountry(dto.country)
        .setCellId(optimalCell.getId())
        .setSearchLastUpdated(dateutil.now());

      console.log(`Adding vehicle ${vehicle.id} to metadata.`);
      MetadataManager.addVehicle(vehicleObj);
    }

    MetadataManager.updateHash();
    fileManager.write(optimalCell.getId(), scraped);

    failedInRow = 0;
  }

  function handleFailed(data) {
    let { baseCell, optimalCell } = data;

    baseCell.setSearchLastUpdated(null).setStatus("failed");
    optimalCell.setSearchLastUpdated(null).setStatus("failed");

    MetadataManager.updateHash();

    failedInRow++;
    if (failedInRow > dto.maxFailedInRow) handleFinish();
  }

  function handleFinish() {
    scraper.close();
  }
};

const pricingService = async (dto) => {
  const scraper = new PricingScraper(dto);
  const fileManager = new FileManager("pricing");

  let vehicles = MetadataManager.getVehicles(filterFn);
  vehicles = vehicles.slice(dto.startAt, dto.limit);

  await scraper.init();

  scraper.onSuccess(handleSuccess);
  scraper.onFailed(handleFailed);
  scraper.onFinish(handleFinish);
  scraper.scrape(vehicles);

  let failedInRow = 0;

  function filterFn(vehicle) {
    if(vehicle) return true;

    return (
      vehicle.getCountry() === dto.country &&
      (dto.ignoreLastUpdated || dateutil.isBeforeToday(vehicle.getPricingLastUpdated()))
    );
  }

  async function handleSuccess(data) {
    const { vehicle, scraped } = data;

    vehicle.setPricingLastUpdated(dateutil.now()).setStatus("success");
    MetadataManager.updateHash();

    // Add the vehicle ID to the scraped object
    const scrapedWithVehicleId = {
      ...scraped,
      vehicleId: vehicle.getId()
    };

    fileManager.write(vehicle.getId(), scrapedWithVehicleId);

    // Send vehicle detail data to Kafka
    await sendToKafka('vehicle-daily-rate-and-availability-topic', scrapedWithVehicleId);

    failedInRow = 0;
  }


  function handleFailed(data) {
    const { vehicle } = data;

    vehicle.setPricingLastUpdated(null).setStatus("failed");
    MetadataManager.updateHash();

    failedInRow++;
    if (failedInRow > dto.maxFailedInRow) handleFinish();
  }

  function handleFinish() {
    scraper.close();
  }
};

const vehicleDetailService = async (dto) => {
  const scraper = new VehicleDetailScraper(dto);
  const fileManager = new FileManager("vehicle_detail");

  let vehicles = MetadataManager.getVehicles(filterFn);
  vehicles = vehicles.slice(dto.startAt, dto.limit);

  await scraper.init();

  scraper.onSuccess(handleSuccess);
  scraper.onFailed(handleFailed);
  scraper.onFinish(handleFinish);
  scraper.scrape(vehicles);

  let failedInRow = 0;

  function filterFn(vehicle) {
    if(vehicle) return true;

    return (
      vehicle.getCountry() === dto.country &&
      (dto.ignoreLastUpdated || dateutil.isBeforeToday(vehicle.getDetailLastUpdated()))
    );
  }

  async function handleSuccess(data) {
    const { vehicle, scraped } = data;

    vehicle.setDetailLastUpdated(dateutil.now()).setStatus("success");
    MetadataManager.updateHash();
    fileManager.write(vehicle.getId(), scraped);

    // Send vehicle detail data to Kafka
    await sendToKafka('vehicle-detail-topic', scraped);

    failedInRow = 0;
  }

  function handleFailed(data) {
    const { vehicle } = data;

    vehicle.setPricingLastUpdated(null).setStatus("failed");
    MetadataManager.updateHash();

    failedInRow++;
    if (failedInRow > dto.maxFailedInRow) handleFinish();
  }

  function handleFinish() {
    scraper.close();
  }
};

const clearDatabaseService = async (dto) => {
  const { type } = dto;
  await FileManager.clear(type);
};

const stopAllService = async () => {
  await BaseScraper.close();
  await disconnectProducer();
};

const getDatabaseSize = async () => {
  return await FileManager.getSize();
};

module.exports = {
  calibrateService,
  searchService,
  pricingService,
  vehicleDetailService,
  clearDatabaseService,
  stopAllService,
  getDatabaseSize,
};
