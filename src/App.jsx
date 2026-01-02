// ... importlar aynı ...

const Dashboard = () => {
  const { sensorData, alerts, history, isOffline } = useSensor();

  // SPRINT 3: Offline Modu Görsel Efekti
  const offlineStyle = isOffline ? { filter: 'grayscale(1) opacity(0.5)', pointerEvents: 'none' } : {};

  return (
    <div style={{ padding: '20px', ...offlineStyle }}>
      {isOffline && (
        <div style={{ position: 'absolute', top: 20, right: 20, background: 'red', color: 'white', padding: '10px', borderRadius: '5px', zIndex: 1000 }}>
          ⚠️ SİSTEM ÇEVRİMDIŞI (HEARTBEAT ERROR)
        </div>
      )}
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{ color: 'var(--text-color)' }}>🏠 Houseguard İzleme Paneli</h1>
      </div>

      {/* Sensör Kartları ve Grafik buraya gelecek... */}
    </div>
  );
};
