// src/services/MockDataService.js - (DONANIM UYUMLU VERSİYON)
export const generateFakeData = () => {
    return {
      // 1. DHT11 Sensörü (Sıcaklık ve Nem)
      temperature: parseFloat((20 + Math.random() * 10).toFixed(1)), // 20-30 arası
      humidity: Math.floor(40 + Math.random() * 20), // %40-%60 arası
      
      // 2. Kapı Sensörü (RF 433MHz)
      door_status: Math.random() > 0.95 ? 'OPEN' : 'CLOSED', // %5 ihtimalle açık
  
      // 3. Hareket Sensörü (PIR) - YENİ
      motion_detected: Math.random() > 0.90 ? 1 : 0, // %10 ihtimalle hareket var
  
      // 4. Gaz Sensörü (MQ-2 vb.) - YENİ
      gas_detected: Math.random() > 0.98 ? 1 : 0, // %2 ihtimalle gaz kaçağı
  
      // 5. Duman Sensörü - YENİ
      smoke_detected: Math.random() > 0.99 ? 1 : 0, // %1 ihtimalle yangın
  
      // 6. SOS Butonu (RF Kumanda)
      sos_alert: Math.random() > 0.995 // %0.5 ihtimalle yardım çağrısı
    };
  };