import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL ?? "mqtt://localhost:1883";
const TOPIC = process.env.MQTT_SENSOR_TOPIC ?? "sensors/temp-01/data";

const client = mqtt.connect(MQTT_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

client.on("connect", () => {
  console.log(`Conectado ao broker: ${MQTT_URL}`);
  const payload = {
    sensorId: "temp-01",
    type: "temperature",
    value: 29.4,
    unit: "°C",
    timestamp: new Date().toISOString(),
    metadata: { location: "Laboratório 1" }
  };
  client.publish(TOPIC, JSON.stringify(payload), { qos: 0 }, (error) => {
    if (error) {
      console.error("Erro ao publicar mensagem", error);
    } else {
      console.log(`Mensagem publicada em ${TOPIC}`);
    }
    client.end();
  });
});

client.on("error", (error) => {
  console.error("Erro no cliente MQTT", error);
});

