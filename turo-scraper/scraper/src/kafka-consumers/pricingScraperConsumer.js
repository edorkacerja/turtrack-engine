const { Kafka } = require('kafkajs');
const PricingScraper = require('../scrapers/PricingScraper');
const { sendToKafka } = require('../utils/kafkaUtil');
const dateutil = require('../utils/dateutil');

const kafka = new Kafka({
    clientId: 'availability-scraper-client',
    brokers: ['kafka:29092']
});

const consumer = kafka.consumer({
    groupId: 'availability-scraper-group',
    maxInFlightRequests: 1
});

let scraper;

async function initializeScraper(startDate, endDate, country) {
    if (!scraper) {
        scraper = new PricingScraper({
            startDate,
            endDate,
            country,
        });
        await scraper.init();
        scraper.onSuccess(handleSuccess);
        scraper.onFailed(handleFailed);
        scraper.onFinish(handleFinish);
    }
    return scraper;
}

async function handleMessage(messageData) {
    const { startDate, endDate, country, vehicleId } = messageData;
    console.log(`Consumed vehicle with id ${vehicleId} to be scraped for availability`);

    const scraper = await initializeScraper(startDate, endDate, country);

    const vehicle = { getId: () => vehicleId };
    await scraper.scrape([vehicle]);
}

async function handleSuccess(data) {
    const { vehicle, scraped } = data;

    const scrapedWithVehicleId = {
        ...scraped,
        vehicleId: vehicle.getId()
    };

    console.log(`Successfully scraped availability for vehicle ${vehicle.getId()}`);

    await sendToKafka('dr-availability-topic', scrapedWithVehicleId);
}

async function handleFailed(data) {
    const { vehicle, error } = data;
    console.log(`Failed to scrape availability for vehicle ${vehicle.getId()}`);

    const dlqMessage = {
        vehicleId: vehicle.getId(),
        error: error ? (error.message || String(error)) : 'Unknown error',
        timestamp: new Date().toISOString(),
    };

    try {
        await sendToKafka('dlq-availability', dlqMessage);
        console.log(`Sent failed vehicle ${vehicle.getId()} to DLQ`);
    } catch (dlqError) {
        console.error(`Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
    }
}

function handleFinish() {
    console.log('Finished processing vehicle');
}

async function startConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'db-vehicles-to-be-scraped-for-availability-topic', fromBeginning: true });

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            const messageData = JSON.parse(message.value.toString());
            await handleMessage(messageData);
            await consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset) + 1).toString() }]);
        },
    });

    console.log('Availability scraper consumer is now running and listening for messages...');
}

// Start the consumer immediately when this module is imported
startConsumer().catch(error => {
    console.error('Failed to start availability scraper consumer:', error);
    process.exit(1);
});

// Export the startConsumer function in case you want to control when it starts elsewhere
module.exports = { startConsumer };