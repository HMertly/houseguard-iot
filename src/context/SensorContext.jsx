// src/context/SensorContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { generateFakeData } from '../services/MockDataService';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const rawData = generateFakeData();
        
        if (rawData.temperature > 100 || rawData.temperature < -20) {
          console.warn("Hatalı Veri Yakalandı:", rawData.temperature);
          return;
        }

        setSensorData(rawData);

        if (rawData.sos_alert) {
          setAlerts(prev => [...prev, { msg: "SOS ALARM!", time: new Date().toLocaleTimeString() }]);
        }

      } catch (error) {
        console.error("Hata:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SensorContext.Provider value={{ sensorData, alerts }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);