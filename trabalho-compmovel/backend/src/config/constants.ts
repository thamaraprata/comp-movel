export const MQTT_EVENTS = {
  SENSOR_DATA: "sensor:data",
  ALERT_TRIGGERED: "alert:triggered"
} as const;

export const SOCKET_EVENTS = {
  SENSOR_UPDATE: "sensor:update",
  ALERT_NEW: "alert:new",
  DASHBOARD_SUBSCRIBE: "dashboard:subscribe"
} as const;

export const SENSOR_TYPES = ["temperature", "humidity", "airQuality", "luminosity", "pressure"] as const;

