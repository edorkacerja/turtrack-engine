require('dotenv').config();
const express = require("express");
const cors = require("cors");
const os = require('os');

const routesV1 = require("./routes/v1");
const MetadataManager = require("./managers/MetadataManager");
const { initializeProducer } = require("./utils/kafkaUtil");
const { startPricingConsumer } = require('./kafka-consumers/PricingConsumer');
const { startVehicleDetailsConsumer } = require('./kafka-consumers/vehicleDetailsConsumer');

const port = process.env.PORT || 5011;
const scraperType = process.env.SCRAPER_TYPE || 'search';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Add the new endpoint here, before starting the server
app.get('/container-id', (req, res) => {
  console.log("got this request...");
  console.log(os.hostname());
  res.send(os.hostname());
});


async function startServer() {
  try {
    console.log(`Starting server with scraper type: ${scraperType}`);



    // Initialize Kafka producer
    await initializeProducer();
    console.log("Kafka producer initialized");

    // Start the appropriate consumer based on SCRAPER_TYPE
    if (scraperType === 'pricing') {
      await startPricingConsumer().catch(console.error);
      console.log("Pricing consumer started successfully");


    } else if (scraperType === 'vehicle-details') {
      await startVehicleDetailsConsumer();
      console.log("Vehicle details consumer started successfully");


    } else if (scraperType === 'search') {
      // Initialize MetadataManager
      await MetadataManager.init();
      MetadataManager.sync(5000);
      console.log("MetadataManager initialized and syncing");


      console.log("Search scraper started successfully.");
    } else {
      throw new Error(`Unknown SCRAPER_TYPE: ${scraperType}`);
    }


    // Set up routes
    app.use("/api/v1", routesV1);

    app.get("/", (req, res) => {
      res.send(`Server started on port ${port}`);
    });

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.status(200).send('OK');
    });

    // Start the server
    app.listen(port, () => console.log(`Server started on port ${port} with ${scraperType} consumer`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();