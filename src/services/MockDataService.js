// src/services/MockDataService.js
export const generateFakeData = () => {
  return {
    timestamp: new Date().toISOString(),
    sensor_id: "ESP32_MAIN_01",
    temperature: (20 + Math.random() * 10).toFixed(1),
    humidity: (40 + Math.random() * 20).toFixed(1),
    door_status: Math.random() > 0.9 ? "OPEN" : "CLOSED",
    sos_alert: Math.random() > 0.98 ? true : false,
  };
};