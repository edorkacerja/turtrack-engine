// utils/kafkaUtil.js

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'vehicle-scraper',
    brokers: ['kafka:29092']
});

let producer;

async function initializeProducer() {
    producer = kafka.producer();
    await producer.connect();
    console.log('Kafka producer connected');
}

async function sendToKafka(topic, message) {
    if (!producer) {
        throw new Error('Producer not initialized');
    }
    try {
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
    } catch (error) {
        console.error('Error sending message to Kafka:', error);
        // Implement retry logic here if needed
        throw error; // Re-throw the error for the caller to handle
    }
}

async function disconnectProducer() {
    if (producer) {
        await producer.disconnect();
        console.log('Kafka producer disconnected');
    }
}

module.exports = {
    initializeProducer,
    sendToKafka,
    disconnectProducer
};