// src/context/SensorContext.jsx (DÜZELTİLMİŞ - Demo Modu Fix)
import { createContext, useState, useEffect, useContext } from 'react';
import { generateFakeData } from '../services/MockDataService';
import { toast } from 'react-toastify';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]); 
  const [alerts, setAlerts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Ayarlar
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('thresholds');
    return saved ? JSON.parse(saved) : { temp: 50, hum: 80 };
  });

  // FIX: Simülasyon Durumu (Normalde null, butona basınca 'FIRE' veya 'SOS' olur)
  const [simulationMode, setSimulationMode] = useState(null);

  const updateThresholds = (newSettings) => {
    setThresholds(newSettings);
    localStorage.setItem('thresholds', JSON.stringify(newSettings));
    toast.success("Ayarlar Kaydedildi!");
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const exportCSV = () => {
    if (alerts.length === 0) {
      toast.info("İndirilecek kayıt yok.");
      return;
    }
    const headers = "Zaman,Tip,Mesaj\n";
    const rows = alerts.map(a => `${a.time},${a.type},${a.msg}`).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guvenlik_loglari_${new Date().toLocaleDateString()}.csv`;
    link.click();
    toast.success("Rapor İndirildi!");
  };

  // FIX: Demo Tetikleyici - Artık modu değiştiriyor ve 15 saniye kilitliyor
  const triggerDemo = (type) => {
    setSimulationMode(type); // Modu aktif et

    if (type === 'FIRE') {
      toast.error("🔥 YANGIN SİMÜLASYONU BAŞLATILDI! (15 Saniye)");
    } else if (type === 'SOS') {
      toast.warn("🆘 SOS SİMÜLASYONU BAŞLATILDI! (15 Saniye)");
    }

    // 15 saniye sonra sistemi normale döndür
    setTimeout(() => {
      setSimulationMode(null);
      toast.info("Simülasyon bitti, sistem normale döndü.");
    }, 15000);
  };

  const alarmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        // 1. Rastgele veriyi al
        let rawData = generateFakeData();
        
        // FIX: EĞER SİMÜLASYON VARSA, VERİYİ ZORLA DEĞİŞTİR
        if (simulationMode === 'FIRE') {
          rawData.temperature = 95; // Sıcaklığı zorla 95 yap
          rawData.humidity = 10;
        } else if (simulationMode === 'SOS') {
          rawData.sos_alert = true; // SOS'i zorla aç
        }

        // Validation
        if (rawData.temperature > 100) return;

        setSensorData(rawData);

        setHistory(prev => {
          const newHistory = [...prev, { 
            time: new Date().toLocaleTimeString(), 
            temp: rawData.temperature,
            hum: rawData.humidity
          }];
          if (newHistory.length > 20) newHistory.shift(); 
          return newHistory;
        });

        // Alarm Kontrolleri
        if (rawData.temperature > thresholds.temp) {
           if (Math.random() > 0.8) { // Spam önleme
             toast.error(`🔥 YÜKSEK SICAKLIK! (${rawData.temperature}°C)`);
             setAlerts(prev => [{ msg: `Yüksek Sıcaklık (${rawData.temperature}°C)`, type: 'CRITICAL', time: new Date().toLocaleTimeString() }, ...prev]);
             alarmSound.play().catch(()=>{});
           }
        }

        if (rawData.door_status === 'OPEN') {
          alarmSound.play().catch(()=>{});
          if (Math.random() > 0.7) { 
             toast.error(`⚠️ KAPI AÇILDI!`);
             setAlerts(prev => [{ msg: "KAPI AÇILDI!", type: 'CRITICAL', time: new Date().toLocaleTimeString() }, ...prev]);
          }
        }

        if (rawData.sos_alert) {
          toast.warn("🆘 SOS SİNYALİ!");
          setAlerts(prev => [{ msg: "SOS ALARM!", type: 'SOS', time: new Date().toLocaleTimeString() }, ...prev]);
        }

      } catch (error) {
        console.error("Hata:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [thresholds, simulationMode]); // FIX: simulationMode değişince burası güncellensin

  return (
    <SensorContext.Provider value={{ sensorData, history, alerts, theme, toggleTheme, thresholds, updateThresholds, exportCSV, triggerDemo }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);