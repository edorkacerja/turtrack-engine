// utils/kafkaUtil.js

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'vehicle-scraper',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    logLevel: logLevel.INFO
});

let producer;

async function initializeProducer(instanceId) {
    while (true) {
        try {
            producer = kafka.producer();
            await producer.connect();
            console.log(`[Instance ${instanceId}] Kafka producer connected`);
            return;
        } catch (error) {
            console.error(`[Instance ${instanceId}] Failed to connect the producer:`, error);
            console.log(`[Instance ${instanceId}] Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function sendToKafka(topic, message, instanceId, retries = 3) {
    if (!producer) {
        await initializeProducer(instanceId);
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            await producer.send({
                topic,
                messages: [{ value: JSON.stringify(message) }],
            });
            return; // Success, exit the function
        } catch (error) {
            console.error(`[Instance ${instanceId}] Error sending message to Kafka (attempt ${attempt + 1}/${retries}):`, error);

            if (error.name === 'KafkaJSConnectionError') {
                console.log(`[Instance ${instanceId}] Connection error. Reconnecting...`);
                await producer.disconnect();
                await initializeProducer(instanceId);
            } else {
                // For other errors, wait before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // If it's the last attempt, throw the error
            if (attempt === retries - 1) throw error;
        }
    }
}

async function disconnectProducer(instanceId) {
    if (producer) {
        try {
            await producer.disconnect();
            console.log(`[Instance ${instanceId}] Kafka producer disconnected`);
        } catch (error) {
            console.error(`[Instance ${instanceId}] Error disconnecting producer:`, error);
        }
    }
}

async function commitOffsetsWithRetry(consumer, topic, partition, offset, instanceId, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await consumer.commitOffsets([{ topic, partition, offset: offset + 1 }]);
            console.log(`[Instance ${instanceId}] Successfully committed offset for partition ${partition}`);
            return;
        } catch (error) {
            console.error(`[Instance ${instanceId}] Error committing offset (attempt ${attempt}/${maxRetries}):`, error);
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