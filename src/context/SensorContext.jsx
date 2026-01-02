import { createContext, useReducer, useEffect, useContext, useState } from 'react';
import { generateFakeData } from '../services/MockDataService';
import { toast } from 'react-toastify';

const SensorContext = createContext();

// SPRINT 2: useReducer Yapısı (Performans ve Karmaşık State Yönetimi İçin)
const initialState = {
  sensorData: null,
  history: [],
  alerts: [],
  theme: localStorage.getItem('theme') || 'light',
  thresholds: JSON.parse(localStorage.getItem('thresholds')) || { temp: 50, hum: 80 },
  isOffline: false, // SPRINT 3: Heartbeat durumu
  simulationMode: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_DATA':
      return { 
        ...state, 
        sensorData: action.payload, 
        isOffline: false, // Veri geldiği sürece online
        history: [...state.history, { 
          time: new Date().toLocaleTimeString(), 
          temp: action.payload.temperature, 
          hum: action.payload.humidity 
        }].slice(-20) 
      };
    case 'SET_OFFLINE':
      return { ...state, isOffline: true };
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_THRESHOLDS':
      return { ...state, thresholds: action.payload };
    case 'SET_SIMULATION':
      return { ...state, simulationMode: action.payload };
    default:
      return state;
  }
}

export const SensorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // SPRINT 3: Heartbeat Monitor (15 Saniye Kontrolü)
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (Date.now() - lastUpdate > 15000) {
        dispatch({ type: 'SET_OFFLINE' });
      }
    }, 5000);
    return () => clearInterval(heartbeatInterval);
  }, [lastUpdate]);

  const updateThresholds = (newSettings) => {
    dispatch({ type: 'SET_THRESHOLDS', payload: newSettings });
    localStorage.setItem('thresholds', JSON.stringify(newSettings));
    toast.success("Ayarlar Kaydedildi!");
  };

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
    localStorage.setItem('theme', newTheme);
  };

  const exportCSV = () => {
    const headers = "Zaman,Tip,Mesaj\n";
    const rows = state.alerts.map(a => `${a.time},${a.type},${a.msg}`).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' }); // SPRINT 5: BOM Karakteri
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `houseguard_logs.csv`;
    link.click();
  };

  const triggerDemo = (type) => {
    dispatch({ type: 'SET_SIMULATION', payload: type });
    setTimeout(() => dispatch({ type: 'SET_SIMULATION', payload: null }), 15000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      let rawData = generateFakeData();
      if (state.simulationMode === 'FIRE') rawData.temperature = 95;
      
      dispatch({ type: 'UPDATE_DATA', payload: rawData });
      setLastUpdate(Date.now()); // Zamanı güncelle

      // Alarmlar
      if (rawData.temperature > state.thresholds.temp) {
        dispatch({ type: 'ADD_ALERT', payload: { msg: `Yüksek Isı!`, type: 'FIRE', time: new Date().toLocaleTimeString() } });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [state.thresholds, state.simulationMode]);

  return (
    <SensorContext.Provider value={{ ...state, toggleTheme, updateThresholds, exportCSV, triggerDemo }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);
