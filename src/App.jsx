// src/App.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SensorProvider, useSensor } from './context/SensorContext';
import { Shield, Home, Settings, AlertTriangle } from 'lucide-react';

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

const Dashboard = () => {
  // history verisini çekiyoruz
  const { sensorData, alerts, history } = useSensor();

  if (!sensorData) return <div style={{ padding: 20 }}>Veri Bekleniyor...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'black' }}>🏠 Houseguard Canlı İzleme</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <SensorCard title="Sıcaklık" value={sensorData.temperature} unit="°C" />
        <SensorCard title="Nem" value={sensorData.humidity} unit="%" />
        <SensorCard title="Kapı Durumu" value={sensorData.door_status} unit="" alert={sensorData.door_status === 'OPEN'} />
      </div>

      {/* SPRINT 3: Grafik Alanı - DÜZELTİLMİŞ VERSİYON */}
      <div style={{
        marginTop: '30px',
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        // Taşmayı önlemek için kutuya sabit yükseklik vermeyelim, içeriğe göre uzasın
        minHeight: '400px'
      }}>
        {/* Başlığın üst ve alt boşluğunu ayarladık */}
        <h3 style={{ color: '#333', marginTop: '0', marginBottom: '20px' }}>📊 Canlı Sıcaklık Grafiği</h3>

        {/* Grafiğin oturacağı alan */}
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              // Grafiğin kenarlara yapışmasını engellemek için margin ekledik
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />

              {/* Animasyonu kapattık ve noktaları kaldırdık */}
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#8884d8"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="hum"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '30px', border: '1px solid red', padding: '15px', borderRadius: '8px' }}>
        <h3 style={{ color: 'black' }}><AlertTriangle color="red" size={20} /> Güvenlik Logları</h3>
        {alerts.length === 0 ? <p style={{ color: 'black' }}>Sistem Güvenli.</p> : alerts.map((a, i) => (
          <p key={i} style={{ color: 'red' }}>⚠️ {a.time} - {a.msg}</p>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SensorProvider>
      <Router>
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px' }}>
            <h2><Shield /> Houseguard</h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}> <Home size={18} /> Dashboard</Link>
            </nav>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </div>
        </div>
      </Router>
    </SensorProvider>
  );
}