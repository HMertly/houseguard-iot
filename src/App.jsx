// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SensorProvider, useSensor } from './context/SensorContext';
import { Shield, Home, Settings, AlertTriangle } from 'lucide-react';

// Küçük Kart Bileşeni (Component Architecture)
const SensorCard = ({ title, value, unit, alert }) => (
  <div style={{
    border: '1px solid #ddd', padding: '20px', borderRadius: '10px',
    backgroundColor: alert ? '#ffebee' : 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  }}>
    <h3 style={{ color: "#333", marginTop: 0 }}>{title}</h3>
    <h2 style={{ color: alert ? 'red' : '#2196F3' }}>{value} {unit}</h2>
  </div>
);

// Ana Dashboard Sayfası
const Dashboard = () => {
  const { sensorData, alerts } = useSensor();

  if (!sensorData) return <div>Sistem Başlatılıyor...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>🏠 Houseguard Canlı İzleme</h1>

      {/* Sensör Kartları Izgarası */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <SensorCard title="Sıcaklık" value={sensorData.temperature} unit="°C" />
        <SensorCard title="Nem" value={sensorData.humidity} unit="%" />
        <SensorCard title="Kapı Durumu" value={sensorData.door_status} unit="" alert={sensorData.door_status === 'OPEN'} />
      </div>

      {/* Alarm Listesi */}
      <div style={{ marginTop: '30px', border: '1px solid red', padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ color: 'black' }}><AlertTriangle color="red" size={20} /> Güvenlik Logları</h3>
        {alerts.length === 0 ? <p style={{ color: 'black' }}>Sistem Güvenli.</p> : alerts.map((a, i) => (
          <p key={i} style={{ color: 'red' }}>⚠️ {a.time} - {a.msg}</p>
        ))}
      </div>
    </div>
  );
};

// Uygulama İskeleti (Router ve Layout)
export default function App() {
  return (
    <SensorProvider>
      <Router>
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
          {/* Sidebar */}
          <div style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px' }}>
            <h2><Shield /> Houseguard</h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}> <Home size={18} /> Dashboard</Link>
              <Link to="/settings" style={{ color: '#94a3b8', textDecoration: 'none' }}> <Settings size={18} /> Ayarlar</Link>
            </nav>
          </div>

          {/* İçerik Alanı */}
          <div style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<h2>Ayarlar Sayfası (Yapım Aşamasında)</h2>} />
            </Routes>
          </div>
        </div>
      </Router>
    </SensorProvider>
  );
}