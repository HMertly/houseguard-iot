// src/context/SensorContext.jsx
import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { toast } from 'react-toastify';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('thresholds');
    try {
      return saved ? JSON.parse(saved) : { temp: 50, hum: 80 };
    } catch {
      return { temp: 50, hum: 80 };
    }
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
    if (type === 'FIRE') toast.error("🔥 YANGIN VE DUMAN SİMÜLASYONU BAŞLATILDI!");
    if (type === 'SOS') toast.warn("🆘 SOS SİMÜLASYONU BAŞLATILDI!");

    setTimeout(() => {
      setSimulationMode(null);
      toast.info("Simülasyon bitti, sistem normale döndü.");
    }, 15000);
  };

  const alarmSound = useRef(
      new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3')
  );

  // Basit spam önleme: aynı tip alarmı 4 sn içinde tekrar basma
  const lastAlertRef = useRef({});

  const pushAlert = (type, msg, toastFn) => {
    const now = Date.now();
    const last = lastAlertRef.current[type] || 0;
    if (now - last < 4000) return; // cooldown

    lastAlertRef.current[type] = now;

    toastFn(msg);
    setAlerts(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("✅ WS connected (bridge)");
      toast.success("✅ ESP32 Veri Köprüsüne Bağlanıldı");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type !== "sensor") return;

        let rawData = msg.data;

        // --- UI DEMO OVERRIDE (gerçek veriyi bozmaz, sadece ekranda gösterir) ---
        if (simulationMode === 'FIRE') {
          rawData = {
            ...rawData,
            temperature: 95,
            smoke_detected: 1,
            gas_detected: 0
          };
        } else if (simulationMode === 'SOS') {
          rawData = { ...rawData, sos_alert: true };
        }
        // ----------------------------------------------------------------------

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

        // --- ALARM KONTROLLERİ (gerçek veriye göre) ---

        // 1) Sıcaklık
        if (rawData.temperature > thresholds.temp) {
          pushAlert(
              "CRITICAL",
              `🔥 YÜKSEK SICAKLIK! (${rawData.temperature}°C)`,
              toast.error
          );
          alarmSound.current.play().catch(()=>{});
        }

        // 2) Kapı
        if (rawData.door_status === 'OPEN') {
          pushAlert("SECURITY", "⚠️ KAPI AÇILDI!", toast.error);
          alarmSound.current.play().catch(()=>{});
        }

        // 3) SOS
        if (rawData.sos_alert) {
          pushAlert("SOS", "🆘 SOS SİNYALİ!", toast.warn);
        }

        // 4) Gaz
        if (rawData.gas_detected === 1) {
          pushAlert("DANGER", "☠️ GAZ KAÇAĞI TESPİT EDİLDİ!", toast.error);
          alarmSound.current.play().catch(()=>{});
        }

        // 5) Duman
        if (rawData.smoke_detected === 1) {
          pushAlert("FIRE", "☁️ DUMAN ALGILANDI (YANGIN RİSKİ)!", toast.error);
          alarmSound.current.play().catch(()=>{});
        }

        // 6) Hareket (log)
        if (rawData.motion_detected === 1) {
          pushAlert("MOTION", "Hareket Algılandı", toast.info);
        }

      } catch (error) {
        console.error("WS parse error:", error);
      }
    };

    ws.onerror = (e) => {
      console.error("WS error:", e);
      toast.error("❌ WS bağlantı hatası (bridge çalışıyor mu?)");
    };

    ws.onclose = () => {
      console.log("⚠️ WS closed");
      toast.warn("⚠️ WS bağlantısı kapandı");
    };

    return () => ws.close();
  }, [thresholds, simulationMode]);

  return (
      <SensorContext.Provider
          value={{
            sensorData,
            history,
            alerts,
            theme,
            toggleTheme,
            thresholds,
            updateThresholds,
            exportCSV,
            triggerDemo
          }}
      >
        {children}
      </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);
