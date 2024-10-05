// utils/kafkaUtil.js

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'vehicle-scraper',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    logLevel: logLevel.INFO
});

let producer;

async function initializeProducer() {
    while (true) {
        try {
            producer = kafka.producer();
            await producer.connect();
            console.log(`Kafka producer connected`);
            return;
        } catch (error) {
            console.error(`Failed to connect the producer:`, error);
            console.log(`Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function sendToKafka(topic, message, retries = 3) {
    if (!producer) {
        await initializeProducer();
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            await producer.send({
                topic,
                messages: [{ value: JSON.stringify(message) }],
            });
            return; // Success, exit the function
        } catch (error) {
            console.error(`Error sending message to Kafka (attempt ${attempt + 1}/${retries}):`, error);

            if (error.name === 'KafkaJSConnectionError') {
                console.log(`Connection error. Reconnecting...`);
                await producer.disconnect();
                await initializeProducer();
            } else {
                // For other errors, wait before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // If it's the last attempt, throw the error
            if (attempt === retries - 1) throw error;
        }
    }
}

async function disconnectProducer() {
    if (producer) {
        try {
            await producer.disconnect();
            console.log(`Kafka producer disconnected`);
        } catch (error) {
            console.error(`Error disconnecting producer:`, error);
        }
    }
}

async function commitOffsetsWithRetry(consumer, topic, partition, offset, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await consumer.commitOffsets([{ topic, partition, offset: offset }]);
            console.log(`Successfully committed offset ${offset} for partition ${partition}`);
            return;
        } catch (error) {
            console.error(`Error committing offset ${offset} (attempt ${attempt}/${maxRetries}):`, error);
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}


module.exports = {
    initializeProducer,
    sendToKafka,
    disconnectProducer,
    commitOffsetsWithRetry
};