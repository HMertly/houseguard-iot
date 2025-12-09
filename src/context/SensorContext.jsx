// src/context/SensorContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { generateFakeData } from '../services/MockDataService';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  
  // SPRINT 3: Sadece Grafik Verisi (history) ekledik. Offline kontrolü YOK.
  const [history, setHistory] = useState([]); 

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const rawData = generateFakeData();
        
        if (rawData.temperature > 100) return;

        setSensorData(rawData);

        // Grafik için veriyi kaydet (Son 20 veri)
        setHistory(prev => {
          const newHistory = [...prev, { 
            time: new Date().toLocaleTimeString(), 
            temp: rawData.temperature,
            hum: rawData.humidity
          }];
          if (newHistory.length > 20) newHistory.shift(); 
          return newHistory;
        });

        if (rawData.sos_alert) {
          setAlerts(prev => [...prev, { msg: "SOS ALARM!", time: new Date().toLocaleTimeString() }]);
        }

      } catch (error) {
        console.error("Hata:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // history verisini dışarı açıyoruz
  return (
    <SensorContext.Provider value={{ sensorData, alerts, history }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);