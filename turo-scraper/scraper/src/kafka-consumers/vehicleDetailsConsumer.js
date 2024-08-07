const { Kafka } = require('kafkajs');
const VehicleDetailScraper = require('../scrapers/VehicleDetailScraper');
const { sendToKafka } = require('../utils/kafkaUtil');

const kafka = new Kafka({
    clientId: 'vehicle-details-scraper-client',
    brokers: ['kafka:29092']
});

const consumer = kafka.consumer({
    groupId: 'vehicle-details-scraper-group',
    maxInFlightRequests: 1
});

let vehicleDetailsScraper;

async function initializeScraper(config) {
    if (!vehicleDetailsScraper) {
        vehicleDetailsScraper = new VehicleDetailScraper(config);
        await vehicleDetailsScraper.init();
        vehicleDetailsScraper.onSuccess(handleSuccess);
        vehicleDetailsScraper.onFailed(handleFailed);
        vehicleDetailsScraper.onFinish(handleFinish);
    }
    return vehicleDetailsScraper;
}

async function handleMessage(messageData) {
    try {
        if (!messageData || typeof messageData !== 'object' || !messageData.country || !messageData.vehicleId) {
            throw new Error('Invalid message data');
        }

        const { country, vehicleId, startDate, endDate, startTime, endTime } = messageData;
        console.log(`Consumed vehicle with id ${vehicleId} to be scraped for details`);

        const scraper = await initializeScraper({
            country,
            startDate,
            endDate,
            startTime,
            endTime
        });

        const vehicle = { getId: () => vehicleId };
        await scraper.scrape([vehicle]);
    } catch (error) {
        console.error(`Error processing message:`, error);
        await handleFailed({ vehicle: { getId: () => messageData.vehicleId }, error });
    }
}

async function handleSuccess(data) {
    const { vehicle, scraped } = data;

    const scrapedWithVehicleId = {
        ...scraped,
        vehicleId: vehicle.getId()
    };

    console.log(`Successfully scraped details for vehicle ${vehicle.getId()}`);

    await sendToKafka('SCRAPED-vehicle-details-topic', scrapedWithVehicleId);
}

async function handleFailed(data) {
    const { vehicle, error } = data;
    console.log(`Failed to scrape details for vehicle ${vehicle.getId()}`);

    let dlqMessage;

    if (error && error.errors && Array.isArray(error.errors)) {
        dlqMessage = {
            vehicleId: vehicle.getId(),
            error: "invalid_request",
            errors: error.errors.map(err => ({
                field: err.field,
                message: err.message,
                data: err.data
            })),
            timestamp: new Date().toISOString(),
        };
    } else {
        dlqMessage = {
            vehicleId: vehicle.getId(),
            error: error ? (error.message || String(error)) : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }

    try {
        await sendToKafka('DLQ-vehicle-details-topic', dlqMessage);
        console.log(`Sent failed vehicle ${vehicle.getId()} to DLQ`);
    } catch (dlqError) {
        console.error(`Failed to send to DLQ for vehicle ${vehicle.getId()}:`, dlqError);
        // You might want to implement a retry mechanism or alert system here
    }
}

function handleFinish() {
    console.log('Finished processing vehicle details');
}

async function startVehicleDetailsConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'TO-BE-SCRAPED-vehicle-details-topic', fromBeginning: true });

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            const messageData = JSON.parse(message.value.toString());
            await handleMessage(messageData);
            await consumer.commitOffsets([{ topic, partition, offset: (parseInt(message.offset) + 1).toString() }]);
        },
    });

    console.log('Vehicle details scraper consumer is now running and listening for messages...');
}

module.exports = { startVehicleDetailsConsumer };