import mqtt from "mqtt";

const MQTT_URL = process.env.MQTT_URL ?? "mqtt://localhost:1883";
const SENSORS = [
  { id: "temp-01", type: "temperature", location: "Sala de Estar", baseValue: 22, variance: 5 },
  { id: "temp-02", type: "temperature", location: "Quarto", baseValue: 20, variance: 3 },
  { id: "humid-01", type: "humidity", location: "Sala de Estar", baseValue: 50, variance: 20 },
  { id: "humid-02", type: "humidity", location: "Quarto", baseValue: 45, variance: 15 }
];

const client = mqtt.connect(MQTT_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});

function getRandomValue(base: number, variance: number): number {
  const offset = (Math.random() - 0.5) * variance;
  return base + offset;
}

function publishSensorData() {
  SENSORS.forEach(sensor => {
    const value = getRandomValue(sensor.baseValue, sensor.variance);
    const payload = {
      sensorId: sensor.id,
      type: sensor.type,
      value: Math.round(value * 100) / 100,
      unit: sensor.type === "temperature" ? "°C" : "%",
      timestamp: new Date().toISOString(),
      metadata: { location: sensor.location }
    };
    
    const topic = `sensors/${sensor.id}/data`;
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      if (error) {
        console.error(`Erro ao publicar para ${topic}:`, error);
      } else {
        console.log(`[${new Date().toLocaleTimeString()}] Publicado: ${sensor.id} = ${payload.value}${payload.unit}`);
      }
    });
  });
}

client.on("connect", () => {
  console.log(`Conectado ao broker: ${MQTT_URL}`);
  console.log("Iniciando simulação de sensores...");
  
  publishSensorData();
  setInterval(publishSensorData, 5000);
});

client.on("error", (error) => {
  console.error("Erro no cliente MQTT:", error);
});

process.on("SIGINT", () => {
  console.log("\nEncerrando simulador de sensores...");
  client.end();
  process.exit(0);
});