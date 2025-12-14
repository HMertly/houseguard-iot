// src/context/SensorContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { generateFakeData } from '../services/MockDataService';
import { toast } from 'react-toastify'; // Bildirim kütüphanesi

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]); 
  const [alerts, setAlerts] = useState([]);
  
  // SPRINT 4: Tema Durumu (LocalStorage'dan okur, yoksa 'light' yapar)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // SPRINT 4: Tema Değiştirme Fonksiyonu
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Tarayıcı hafızasına kaydet
  };

  // Ses Dosyası (İnternetten basit bir bip sesi)
  const alarmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const rawData = generateFakeData();
        if (rawData.temperature > 100) return;

        setSensorData(rawData);

        // Grafik Geçmişi
        setHistory(prev => {
          const newHistory = [...prev, { 
            time: new Date().toLocaleTimeString(), 
            temp: rawData.temperature,
            hum: rawData.humidity
          }];
          if (newHistory.length > 20) newHistory.shift(); 
          return newHistory;
        });

        // SPRINT 4: Alarm Mantığı (Ses ve Toast)
        if (rawData.door_status === 'OPEN') {
          // 1. Ses Çal (Tarayıcı izin verirse)
          alarmSound.play().catch(e => console.log("Ses çalma engellendi (önce tıklama lazım)"));
          
          // 2. Toast Bildirimi At (Eğer son 2 saniyede atılmadıysa)
          // (Burada spam olmasın diye basit bir mantık kuruyoruz, normalde daha detaylı olur)
          if (Math.random() > 0.7) { 
             toast.error(`⚠️ KAPI AÇILDI! (${new Date().toLocaleTimeString()})`);
             setAlerts(prev => [{ msg: "KAPI AÇILDI!", type: 'CRITICAL', time: new Date().toLocaleTimeString() }, ...prev]);
          }
        }

        // SOS Durumu
        if (rawData.sos_alert) {
          toast.warn("🆘 SOS SİNYALİ ALINDI!");
          setAlerts(prev => [{ msg: "SOS ALARM!", type: 'SOS', time: new Date().toLocaleTimeString() }, ...prev]);
        }

      } catch (error) {
        console.error("Hata:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SensorContext.Provider value={{ sensorData, history, alerts, theme, toggleTheme }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);