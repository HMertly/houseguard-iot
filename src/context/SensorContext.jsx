// src/context/SensorContext.jsx - (MERT'İN KODUYLA EŞLEŞTİRİLDİ)
import { createContext, useState, useEffect, useContext } from 'react';
import { generateFakeData } from '../services/MockDataService';
import { toast } from 'react-toastify';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]); 
  const [alerts, setAlerts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('thresholds');
    return saved ? JSON.parse(saved) : { temp: 50, hum: 80 };
  });

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

  const triggerDemo = (type) => {
    setSimulationMode(type);
    if (type === 'FIRE') {
      toast.error("🔥 YANGIN VE DUMAN SİMÜLASYONU BAŞLATILDI!");
    } else if (type === 'SOS') {
      toast.warn("🆘 SOS SİMÜLASYONU BAŞLATILDI!");
    }
    setTimeout(() => {
      setSimulationMode(null);
      toast.info("Simülasyon bitti, sistem normale döndü.");
    }, 15000);
  };

  const alarmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        let rawData = generateFakeData();
        
        // --- SİMÜLASYON MANTIĞI ---
        if (simulationMode === 'FIRE') {
          rawData.temperature = 95; 
          rawData.smoke_detected = 1; // Yangında duman da olur
          rawData.gas_detected = 0;
        } else if (simulationMode === 'SOS') {
          rawData.sos_alert = true;
        }
        // --------------------------

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

        // --- ALARM KONTROLLERİ ---
        
        // 1. Sıcaklık Kontrolü
        if (rawData.temperature > thresholds.temp) {
           if (Math.random() > 0.8) {
             toast.error(`🔥 YÜKSEK SICAKLIK! (${rawData.temperature}°C)`);
             setAlerts(prev => [{ msg: `Yüksek Sıcaklık (${rawData.temperature}°C)`, type: 'CRITICAL', time: new Date().toLocaleTimeString() }, ...prev]);
             alarmSound.play().catch(()=>{});
           }
        }

        // 2. Kapı Kontrolü
        if (rawData.door_status === 'OPEN') {
          alarmSound.play().catch(()=>{});
          if (Math.random() > 0.7) { 
             toast.error(`⚠️ KAPI AÇILDI!`);
             setAlerts(prev => [{ msg: "KAPI AÇILDI!", type: 'SECURITY', time: new Date().toLocaleTimeString() }, ...prev]);
          }
        }

        // 3. SOS Kontrolü
        if (rawData.sos_alert) {
          toast.warn("🆘 SOS SİNYALİ!");
          setAlerts(prev => [{ msg: "SOS BUTONU!", type: 'SOS', time: new Date().toLocaleTimeString() }, ...prev]);
        }

        // 4. Gaz Kontrolü (YENİ)
        if (rawData.gas_detected === 1) {
          alarmSound.play().catch(()=>{});
          toast.error("☠️ GAZ KAÇAĞI TESPİT EDİLDİ!");
          setAlerts(prev => [{ msg: "GAZ KAÇAĞI!", type: 'DANGER', time: new Date().toLocaleTimeString() }, ...prev]);
        }

        // 5. Duman Kontrolü (YENİ)
        if (rawData.smoke_detected === 1) {
          alarmSound.play().catch(()=>{});
          toast.error("☁️ DUMAN ALGILANDI (YANGIN RİSKİ)!");
          setAlerts(prev => [{ msg: "DUMAN TESPİTİ!", type: 'FIRE', time: new Date().toLocaleTimeString() }, ...prev]);
        }

        // 6. Hareket Kontrolü (YENİ) - Sadece log düşsün, çok ses yapmasın
        if (rawData.motion_detected === 1) {
           if(Math.random() > 0.9) { // Çok spam yapmasın
             setAlerts(prev => [{ msg: "Hareket Algılandı", type: 'MOTION', time: new Date().toLocaleTimeString() }, ...prev]);
           }
        }

      } catch (error) {
        console.error("Hata:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [thresholds, simulationMode]);

  return (
    <SensorContext.Provider value={{ sensorData, history, alerts, theme, toggleTheme, thresholds, updateThresholds, exportCSV, triggerDemo }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);