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

let pricingScraper;

async function initializeScraper(startDate, endDate, country) {
    if (!pricingScraper) {
        pricingScraper = new PricingScraper({
            startDate,
            endDate,
            country,
        });
        await pricingScraper.init();
        pricingScraper.onSuccess(handleSuccess);
        pricingScraper.onFailed(handleFailed);
        pricingScraper.onFinish(handleFinish);
    }
    return pricingScraper;
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

    await sendToKafka('SCRAPED-dr-availability-topic', scrapedWithVehicleId);
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
        await sendToKafka('DLQ-dr-availability-topic', dlqMessage);
        console.log(`Sent failed vehicle ${vehicle.getId()} to DLQ`);
    } catch (dlqError) {
        console.error(`Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
    }
}

function handleFinish() {
    console.log('Finished processing vehicle');
}

async function startPricingConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'TO-BE-SCRAPED-dr-availability-topic', fromBeginning: true });

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

module.exports = { startPricingConsumer };