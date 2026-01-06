// bridge/server.js
import mqtt from "mqtt";
import { WebSocketServer } from "ws";

// ====== MQTT AYARLARI (LOCAL MOSQUITTO) ======
const MQTT_HOST = "mqtt://unknownland.org:1883";
const MQTT_TOPIC = "rfc/sensor";

// ✅ SADECE BU ID'DEN GELEN VERİLER KABUL EDİLECEK
const ALLOWED_DEVICE_ID = "5435169211";

// ====== WEBSOCKET AYARLARI ======
const WSS_PORT = 8080;
const wss = new WebSocketServer({ port: WSS_PORT });

console.log(`✅ WebSocket server listening on ws://localhost:${WSS_PORT}`);

function broadcast(obj) {
    const msg = JSON.stringify(obj);
    for (const client of wss.clients) {
        if (client.readyState === 1) client.send(msg);
    }
}

// WS client connect log
wss.on("connection", (ws) => {
    console.log("🟢 WS client connected");
    ws.send(JSON.stringify({ type: "info", message: "ws_connected" }));
    ws.on("close", () => console.log("🟡 WS client disconnected"));
});

// ====== MQTT CONNECT (AUTH YOK) ======
const mqttClient = mqtt.connect(MQTT_HOST, {
    reconnectPeriod: 2000,
    keepalive: 60,
    username: "alp",
    password: "tfl867TFL",
});

mqttClient.on("connect", () => {
    console.log("✅ MQTT connected:", MQTT_HOST);

    mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
            console.error("❌ MQTT subscribe error:", err.message);
        } else {
            console.log("📡 Subscribed to:", MQTT_TOPIC);
            console.log(`🔒 Device filter active → ID = ${ALLOWED_DEVICE_ID}`);
        }
    });
});

mqttClient.on("reconnect", () => console.log("🔄 MQTT reconnecting..."));
mqttClient.on("close", () => console.log("⚠️ MQTT connection closed"));
mqttClient.on("offline", () => console.log("⚠️ MQTT offline"));
mqttClient.on("error", (err) => console.error("❌ MQTT error:", err.message));

// ====== MQTT -> WS FORWARD (ID FILTERLİ) ======
mqttClient.on("message", (topic, payload) => {
    try {
        const text = payload.toString();
        // Debug için: bazen JSON değilse anlarız
        // console.log("📩 RAW MQTT:", text);

        const raw = JSON.parse(text);

        // 🔐 ID FİLTRELEME
        if (String(raw.ID) !== ALLOWED_DEVICE_ID) {
            console.log(`⛔ Paket reddedildi (ID=${raw.ID})`);
            return;
        }

        const mapped = {
            temperature: Number(raw.TEMP ?? raw.temperature ?? 0),
            humidity: Number(raw.HUM ?? raw.humidity ?? 0),

            // UI: door_status 'OPEN'/'CLOSED'
            door_status: Number(raw.DOOR_OPENED ?? 0) === 1 ? "OPEN" : "CLOSED",

            motion_detected: Number(raw.MOTION ?? 0),
            gas_detected: Number(raw.GAS ?? 0),
            smoke_detected: Number(raw.SMOKE ?? 0),

            sos_alert: Number(raw.SOS ?? 0) === 1,

            id: String(raw.ID),
            ts: raw.ts ?? Date.now(),
            _topic: topic,
        };

        broadcast({ type: "sensor", data: mapped });
        console.log("➡️ forwarded (AUTHORIZED):", mapped);
    } catch (e) {
        console.error("❌ JSON parse/map error:", e.message);
    }
});
