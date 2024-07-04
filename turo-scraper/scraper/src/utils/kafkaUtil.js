// utils/kafkaUtil.js

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'vehicle-scraper',
    brokers: ['kafka:29092']
});

const producer = kafka.producer();

async function sendToKafka(topic, message) {
    try {
        await producer.connect();
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
    } catch (error) {
        console.error('Error sending message to Kafka:', error);
    }
}

async function disconnectProducer() {
    await producer.disconnect();
}

module.exports = {
    sendToKafka,
    disconnectProducer
};