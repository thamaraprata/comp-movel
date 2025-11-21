export interface Sensor {
  id: string;
  name: string;
  location: string;
  type: 'temperature' | 'humidity' | 'pressure';
  created_at: string;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  sensor_id: string;
  rule: string;
  value: number;
  threshold: number;
  status: 'active' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface Threshold {
  sensor_type: string;
  min_value: number;
  max_value: number;
  updated_at: string;
}

export interface MQTTPayload {
  sensorId: string;
  type: string;
  value: number;
  unit?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface WeatherContext {
  temperature: number;
  humidity: number;
  location: string;
  conditions: string;
}

export interface AITip {
  title: string;
  description: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  actions: string[];
}
