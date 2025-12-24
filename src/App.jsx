// src/App.jsx (Final Sürüm)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SensorProvider, useSensor } from './context/SensorContext';
import { Shield, Home, Settings, AlertTriangle, Sun, Moon, Download, Flame, Siren } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ...SensorCard bileşeni aynı...
const SensorCard = ({ title, value, unit, alert }) => (
  <div style={{
    border: '1px solid var(--border-color)', 
    padding: '20px', 
    borderRadius: '10px',
    backgroundColor: alert ? '#ef4444' : 'var(--card-bg)', 
    color: alert ? 'white' : 'var(--text-color)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: '0.3s'
  }}>
    <h3 style={{ marginTop: 0, opacity: 0.8, color: 'inherit' }}>{title}</h3>
    <h2 style={{ fontSize: '2rem', margin: '10px 0', color: 'inherit' }}>{value} {unit}</h2>
  </div>
);

// ...Dashboard bileşeni aynı...
const Dashboard = () => {
  const { sensorData, alerts, history } = useSensor();
  const [filterType, setFilterType] = useState('ALL');

  if (!sensorData) return <div style={{padding: 20}}>Sistem Başlatılıyor...</div>;

  const filteredAlerts = alerts.filter(log => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{ color: 'var(--text-color)' }}>🏠 Canlı İzleme</h1>
        <span style={{fontSize:'0.9rem', opacity:0.7}}>Son Güncelleme: {new Date().toLocaleTimeString()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <SensorCard title="Sıcaklık" value={sensorData.temperature} unit="°C" />
        <SensorCard title="Nem" value={sensorData.humidity} unit="%" />
        <SensorCard title="Kapı Durumu" value={sensorData.door_status} unit="" alert={sensorData.door_status === 'OPEN'} />
      </div>

      <div style={{ marginTop: '30px', background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', minHeight: '400px', border: '1px solid var(--border-color)' }}>
        <h3 style={{marginTop: '0', marginBottom: '20px', color: 'var(--text-color)'}}>📊 Sıcaklık Grafiği</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" stroke="var(--text-color)" fontSize={12} />
              <YAxis stroke="var(--text-color)" fontSize={12} />
              <Tooltip contentStyle={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)'}} />
              <Line type="monotone" dataKey="temp" stroke="#8884d8" strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '30px', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', background: 'var(--card-bg)' }}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
          <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:'10px', color: 'var(--text-color)' }}>
            <AlertTriangle color="red" size={20} /> Güvenlik Logları
          </h3>
          <div style={{display:'flex', gap:'5px'}}>
             <button onClick={() => setFilterType('ALL')} style={{background: filterType==='ALL'?'#3b82f6':'gray', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>Tümü</button>
             <button onClick={() => setFilterType('CRITICAL')} style={{background: filterType==='CRITICAL'?'#ef4444':'gray', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>Kritik</button>
          </div>
        </div>
        <div style={{maxHeight: '200px', overflowY: 'auto'}}>
          {filteredAlerts.length === 0 ? <p style={{ opacity: 0.6 }}>Kayıt yok.</p> : filteredAlerts.map((a, i) => (
            <div key={i} style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', color: a.type === 'CRITICAL' ? 'red' : a.type === 'SOS' ? 'orange' : 'inherit' }}>
              <strong>[{a.type}]</strong> {a.time} - {a.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// SPRINT 5: Yeni Ayarlar Sayfası
const SettingsPage = () => {
  const { thresholds, updateThresholds, exportCSV, triggerDemo } = useSensor();
  const [tempLimit, setTempLimit] = useState(thresholds.temp);

  const handleSave = () => {
    updateThresholds({ ...thresholds, temp: Number(tempLimit) });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--text-color)' }}>⚙️ Sistem Ayarları</h1>
      
      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <h3 style={{marginTop:0, color: 'var(--text-color)'}}>Alarm Sınırları</h3>
        <div style={{marginBottom: '15px'}}>
          <label style={{display:'block', marginBottom:'5px', color:'var(--text-color)'}}>Maksimum Sıcaklık (°C):</label>
          <input 
            type="number" 
            value={tempLimit} 
            onChange={(e) => setTempLimit(e.target.value)}
            style={{padding:'10px', width:'100%', borderRadius:'5px', border:'1px solid #ccc'}} 
          />
        </div>
        <button onClick={handleSave} style={{background: '#22c55e', color:'white', padding:'10px 20px', border:'none', borderRadius:'5px', width:'100%'}}>
          Kaydet
        </button>
      </div>

      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <h3 style={{marginTop:0, color: 'var(--text-color)'}}>Demo / Senaryo Modu</h3>
        <p style={{opacity:0.7, fontSize:'0.9rem'}}>Sunum sırasında acil durumları manuel tetiklemek için kullanın.</p>
        <div style={{display:'flex', gap:'10px'}}>
          <button onClick={() => triggerDemo('FIRE')} style={{background: '#ef4444', color:'white', padding:'15px', border:'none', borderRadius:'5px', flex:1, display:'flex', justifyContent:'center', gap:'10px'}}>
            <Flame /> Yangın Başlat
          </button>
          <button onClick={() => triggerDemo('SOS')} style={{background: '#f59e0b', color:'white', padding:'15px', border:'none', borderRadius:'5px', flex:1, display:'flex', justifyContent:'center', gap:'10px'}}>
            <Siren /> SOS Sinyali
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '20px' }}>
        <h3 style={{marginTop:0, color: 'var(--text-color)'}}>Veri Yönetimi</h3>
        <button onClick={exportCSV} style={{background: '#3b82f6', color:'white', padding:'15px', border:'none', borderRadius:'5px', width:'100%', display:'flex', justifyContent:'center', gap:'10px'}}>
          <Download /> Güvenlik Raporunu İndir (.CSV)
        </button>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const { theme, toggleTheme } = useSensor();

  return (
    <div data-theme={theme} style={{ display: 'flex', minHeight: '100vh', transition: '0.3s' }}>
      <div style={{ width: '250px', background: 'var(--sidebar-bg)', color: 'white', padding: '20px', transition: '0.3s' }}>
        <h2><Shield /> Houseguard</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
          <Link to="/" style={{ color: 'white', opacity: 0.8 }}> <Home size={18} /> Dashboard</Link>
          <Link to="/settings" style={{ color: 'white', opacity: 0.8 }}> <Settings size={18} /> Ayarlar</Link>
        </nav>
        
        <button onClick={toggleTheme} style={{marginTop: '50px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '5px'}}>
          {theme === 'light' ? <><Moon size={16}/> Gece Modu</> : <><Sun size={16}/> Gündüz Modu</>}
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', transition: '0.3s' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme={theme} />
    </div>
  );
};

export default function App() {
  return (
    <SensorProvider>
      <Router>
        <MainLayout />
      </Router>
    </SensorProvider>
  );
}