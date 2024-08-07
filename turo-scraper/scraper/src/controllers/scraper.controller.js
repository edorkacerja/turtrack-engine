const services = require("../services/scraper.service");
const PricingRequest = require("../dtos/pricingRequest.dto");
const Searchrequest = require("../dtos/searchRequest.dto");
const Response = require("../dtos/response.dto");
const VehicleDetailRequest = require("../dtos/vehicleDetailRequest.dto");
const ResetRequestDTO = require("../dtos/resetRequest.dto");
const CalibrateRequest = require("../dtos/calibrateRequest.dto");

const calibrate = async (req, res) => {
  const body = req.body;
  try {
    const calibrateDTO = new CalibrateRequest(body);
    const data = await services.calibrateService(calibrateDTO);
    res.status(200).send(new Response(false, "calibrating the scraper", data));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

const search = async (req, res) => {
  const body = req.body;

  try {
    const searchDTO = new Searchrequest(body);
    await services.searchService(searchDTO);
    res.status(200).send(new Response(false, "searching for vehicles"));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

const dailyPricing = async (req, res) => {
  const body = req.body;

  try {
    const pricingDto = new PricingRequest(body);
    await services.pricingService(pricingDto);
    res.status(200).send(new Response(false, "scraping daily pricing"));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

const vehicleDetail = async (req, res) => {
  const body = req.body;

  try {
    const vehicleDetailDto = new VehicleDetailRequest(body);
    await services.vehicleDetailService(vehicleDetailDto);
    res.status(200).send(new Response(false, "scraping vehicle details"));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

const stopAll = async (req, res) => {
  try {
    await services.stopAllService();
    res.status(200).send(new Response(false, "running scrapers closed"));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

const clearDatabase = async (req, res) => {
  const body = req.body;

  try {
    const clearDatabaseDto = new ResetRequestDTO(body);
    await services.clearDatabaseService(clearDatabaseDto);
    res.status(200).send(new Response(false, "clearing database of the scraper."));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

const getDatabaseSize = async (req, res) => {
  try {
    const size = await services.getDatabaseSize();
    res.status(200).send(new Response(false, "database size", size));
  } catch (error) {
    console.log(error);
    res.status(500).send(new Response(true, error.toString()));
  }
};

// const reset = async (req, res) => {
//   try {
//     await services.resetService();
//     res.status(200).send(new Response(false, "resetting the scraper"));
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(new Response(true, error.toString()));
//   }
// }

module.exports = {
  calibrate,
  search,
  dailyPricing,
  vehicleDetail,
  clearDatabase,
  stopAll,
  getDatabaseSize,
};
