// src/App.jsx - (Renk Sorunu Giderilmiş Versiyon)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SensorProvider, useSensor } from './context/SensorContext';
import { Shield, Home, Settings, AlertTriangle, Sun, Moon } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SensorCard = ({ title, value, unit, alert }) => (
  <div style={{
    border: '1px solid var(--border-color)', 
    padding: '20px', 
    borderRadius: '10px',
    backgroundColor: alert ? '#ef4444' : 'var(--card-bg)', 
    color: alert ? 'white' : 'var(--text-color)', // Rengi değişkene bağladık
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: '0.3s'
  }}>
    <h3 style={{ marginTop: 0, opacity: 0.8, color: 'inherit' }}>{title}</h3>
    <h2 style={{ fontSize: '2rem', margin: '10px 0', color: 'inherit' }}>{value} {unit}</h2>
  </div>
);

const Dashboard = () => {
  const { sensorData, alerts, history } = useSensor();
  const [filterType, setFilterType] = useState('ALL');

  if (!sensorData) return <div style={{padding: 20}}>Sistem Verisi Bekleniyor...</div>;

  const filteredAlerts = alerts.filter(log => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        {/* Başlık rengini değişkene bağladık */}
        <h1 style={{ color: 'var(--text-color)' }}>🏠 Canlı İzleme</h1>
        <span style={{fontSize:'0.9rem', opacity:0.7}}>Son Güncelleme: {new Date().toLocaleTimeString()}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <SensorCard title="Sıcaklık" value={sensorData.temperature} unit="°C" />
        <SensorCard title="Nem" value={sensorData.humidity} unit="%" />
        <SensorCard title="Kapı Durumu" value={sensorData.door_status} unit="" alert={sensorData.door_status === 'OPEN'} />
      </div>

      {/* Grafik Alanı */}
      <div style={{ marginTop: '30px', background: 'var(--card-bg)', padding: '20px', borderRadius: '10px', minHeight: '400px', border: '1px solid var(--border-color)' }}>
        {/* ESKİ HATALI KOD: color: '#333' --- YENİ KOD: color: 'var(--text-color)' */}
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

      {/* Log Paneli */}
      <div style={{ marginTop: '30px', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px', background: 'var(--card-bg)' }}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
          {/* Başlık rengini düzelttik */}
          <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:'10px', color: 'var(--text-color)' }}>
            <AlertTriangle color="red" size={20} /> Güvenlik Logları
          </h3>
          
          <div style={{display:'flex', gap:'5px'}}>
            <button onClick={() => setFilterType('ALL')} style={{background: filterType==='ALL'?'#3b82f6':'gray', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>Tümü</button>
            <button onClick={() => setFilterType('CRITICAL')} style={{background: filterType==='CRITICAL'?'#ef4444':'gray', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>Kapı</button>
            <button onClick={() => setFilterType('SOS')} style={{background: filterType==='SOS'?'#f59e0b':'gray', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>SOS</button>
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

const MainLayout = () => {
  const { theme, toggleTheme } = useSensor();

  return (
    <div data-theme={theme} style={{ display: 'flex', minHeight: '100vh', transition: '0.3s' }}>
      <div style={{ width: '250px', background: 'var(--sidebar-bg)', color: 'white', padding: '20px', transition: '0.3s' }}>
        <h2><Shield /> Houseguard</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
          <Link to="/" style={{ color: 'white', opacity: 0.8 }}> <Home size={18} /> Dashboard</Link>
          <Link to="/settings" style={{ color: 'white', opacity: 0.5 }}> <Settings size={18} /> Ayarlar</Link>
        </nav>
        
        <button onClick={toggleTheme} style={{marginTop: '50px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '5px'}}>
          {theme === 'light' ? <><Moon size={16}/> Gece Modu</> : <><Sun size={16}/> Gündüz Modu</>}
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', transition: '0.3s' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<h2>Ayarlar Sayfası</h2>} />
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