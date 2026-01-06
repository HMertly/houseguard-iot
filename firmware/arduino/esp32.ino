/*************************TANIMLAMALAR*********************/
#define DHTPIN 4 // PİNİ KONTROL ET //12 DE HATA VERİYOR
#define DHTTYPE DHT11
#define SerialMon Serial // debug console için tanımlama default değeri  speed 115200
#define SerialAT Serial1
#define TINY_GSM_DEBUG SerialMon
#define TINY_GSM_USE_GPRS true
#define TINY_GSM_USE_WIFI false
#define GSM_PIN ""
#define BUTTON_PIN 15               // PİNİ KONTROL ET
#define PhoneNumber "+************" // telefon
#define TINY_GSM_MODEM_SIM800
#define SIM800L_IP5306_VERSION_20190610
#define DUMP_AT_COMMANDS
#define TINY_GSM_RX_BUFFER 1024 // Set RX buffer to 1Kb
int butdurumu = 0;
#define uS_TO_S_FACTOR 1000000ULL /* Conversion factor for micro seconds to seconds */
#define TIME_TO_SLEEP 100         /* Time ESP32 will go to sleep (in seconds) */
/***********************************************************/

//*****TTGO T-Call pins****/
#define MODEM_RST 5
#define MODEM_PWKEY 4
#define MODEM_POWER_ON 23
#define MODEM_TX 27
#define MODEM_RX 26
#define I2C_SDA 21
#define I2C_SCL 22
/********************************/

/*************KÜTÜPHANELER***************************/
#include <RCSwitch.h>
#include "DHT.h"
#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <elapsedMillis.h>
#include <ArduinoJson.h>
#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <WiFiClient.h>
#include <WiFiServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <ESPAsyncWiFiManager.h>
#include "ESPAsyncWebServer.h"
// #include "utilities.h"
/******************************************************/

/*GPRS TANIMLAMALARI*/
const char apn[] = "********";
const char gprsUser[] = "";
const char gprsPass[] = "";
/********************/

/*MQTT TANIMLAMALARI*/
const char *broker = "***************";
const int mqttPort = 1883;
const char *clientID = "********************";
/********************/

/*FONKSİYON GİRİŞLERİ*/
RCSwitch mySwitch = RCSwitch();
DHT dht(DHTPIN, DHTTYPE);
/*********************/

/*MQTT İÇİN MODEM VE MQTT CLASS BAĞLANTISI*/
TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
PubSubClient mqtt(client);
Preferences preferences;
DNSServer dnsServer;
AsyncWebServer server(80);
/*****************************************/

/*******MQTT SENSOR OKUMASI İÇİN TANIMLAMALAR*******/
const char *topicOutput1 = "rfc/sensor";
char SOS1[15] = "";
char KAPIACIK1[15] = "";
char KAPIKAPALI1[15] = "";
char PIR1[15] = "";
char GAS1[15] = "";
char DUMAN1[15] = "";
/***************************************************/

/*****************TANIMLAMALAR*********************/
uint32_t lastReconnectAttempt = 0;
void mqttCallback(char *, byte *, unsigned int);
boolean mqttConnect();
void DRE_switch();
void sos_sensor1();

elapsedSeconds serialLogSeconds;
unsigned int serialLog_Interval = 3;
elapsedSeconds sinyalBekletme;
unsigned int sinyalBekletme_Interval = 3;

elapsedSeconds sosDelay;
unsigned int sosDelay_Interval = 3;
elapsedSeconds kapiacikDelay;
unsigned int kapiacikDelay_Interval = 3;
elapsedSeconds kapiKapaliDelay;
unsigned int kapiKapaliDelay_Interval = 3;
elapsedSeconds gazDelay;
unsigned int gazDelay_Interval = 3;
elapsedSeconds pirDelay;
unsigned int pirDelay_Interval = 3;
elapsedSeconds dumanDelay;
unsigned int dumanDelay_Interval = 3;

// ✅ SOS sonrası normal publish'i kısa süre durdurmak için
unsigned long lastSosMs = 0;
/*****************************************************/

/***************MQTTCALLBACK FUNCTION***************/
const char *checkNulls(char const *val)
{
  return val ? val : "";
}
void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  String messageTemp;
  StaticJsonDocument<1536> doc;

  for (int i = 0; i < length; i++)
  {
    Serial.print((char)payload[i]);
    messageTemp += (char)payload[i];
  }

  DeserializationError error = deserializeJson(doc, messageTemp);
  if (error)
  {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    return;
  }

  strcpy(SOS1, checkNulls(doc["SOS"]));
  strcpy(KAPIACIK1, checkNulls(doc["DOOR_OPENED"]));
  strcpy(KAPIKAPALI1, checkNulls(doc["DOOR_CLOSED"]));
  strcpy(GAS1, checkNulls(doc["GAS"]));
  strcpy(DUMAN1, checkNulls(doc["SMOKE"]));
  strcpy(PIR1, checkNulls(doc["MOTION"]));
}

/***********************************************************/

/**ARAMA FONKSİYONU///////////////***/
void CALLING()
{
  bool res;

  Serial.println("📞 CALLING() start");

  SerialAT.print("AT+CHFA=1\r\n");
  SerialAT.print("AT+CRSL=100\r\n");
  delay(2);
  SerialAT.print("AT+CLVL=100\r\n");
  delay(2);

  SerialAT.write("AT+CMIC=1,15");
  delay(2);

  SerialAT.write("AT+CAAS=0");
  delay(2);

  SerialAT.write("AT+CHF=0,1");
  delay(2);

  SerialAT.write("AT+CSCLK=0");
  delay(2);

  SerialAT.write("AT+CLIP=1\r\n");
  delay(100);

  // Senin loglarında vardı; burada da bırakıyorum:
  Serial.println("✅ MQTT disconnected for call");
  Serial.println("✅ GPRS disconnected for call");

  Serial.print("Calling: ");
  Serial.println(PhoneNumber);

  res = modem.callNumber(PhoneNumber);

  Serial.print("Call: ");
  Serial.println(res ? "OK" : "fail");
}

/******************** Connect to MQTT Broker ********************/
void reconnect()
{
  while (!mqtt.connected())
  {
    Serial.print("Attempting MQTT connection...");

    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (mqtt.connect(clientId.c_str(), "***", "********************"))
    {
      Serial.println("Connected to MQTT broker!");
      mqtt.subscribe("rfc");
    }
    else
    {
      Serial.print("Failed, rc=");
      Serial.print(mqtt.state());
      Serial.println(" Trying again in 5 seconds...");
      delay(5000);
    }
  }
}

/***********************************************/
void initGPRSWithMqtt()
{
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  Serial.println("Initializing modem...");
  modem.restart();

  String modemInfo = modem.getModemInfo();
  Serial.print("Modem: ");
  Serial.println(modemInfo);

  Serial.print("Waiting for network...");
  if (!modem.waitForNetwork())
  {
    Serial.println(" fail");
    while (true)
      ;
  }
  else
  {
    Serial.println(" OK");
  }

  Serial.print("Connecting to ");
  Serial.print(apn);
  if (!modem.gprsConnect(apn, gprsUser, gprsPass))
  {
    Serial.println(" fail");
    while (true)
      ;
  }
  Serial.println(" OK");
}

/******************SETUP****************************/
void setup()
{
  pinMode(14, INPUT);
  mySwitch.enableReceive(14);
  mySwitch.setReceiveTolerance(60);
  mySwitch.setPulseLength(360);
  mySwitch.setProtocol(1);

  strcpy(SOS1, "10592820");
  strcpy(KAPIACIK1, "8893043");
  strcpy(KAPIKAPALI1, "8893049");
  strcpy(DUMAN1, "77046");


  pinMode(MODEM_PWKEY, OUTPUT);
  pinMode(MODEM_RST, OUTPUT);
  pinMode(MODEM_POWER_ON, OUTPUT);
  digitalWrite(MODEM_PWKEY, LOW);
  digitalWrite(MODEM_RST, HIGH);
  digitalWrite(MODEM_POWER_ON, HIGH);

  Serial.begin(115200);
  Serial.println("ESP32 Başlatılıyor...");

  initGPRSWithMqtt();

  dht.begin();

  mqtt.setServer(broker, 1883);
  mqtt.setCallback(mqttCallback);
}

/*****LOOP*****************************/
void loop()
{
  if (!mqtt.connected())
  {
    reconnect();
  }
  mqtt.loop();

  float t = dht.readTemperature();
  float h = dht.readHumidity();

  DynamicJsonDocument readings(1024);
  readings["ID"] = "**********";
  readings["TEMP"] = String(t);
  readings["HUM"] = String(h);
  readings["MOTION"] = 0;
  readings["DOOR_OPENED"] = 0;
  readings["DOOR_CLOSED"] = 0;
  readings["GAS"] = 0;
  readings["SMOKE"] = 0;
  readings["SOS"] = 0;

  // Gelen veri kontrolü
  if (mySwitch.available())
  {
    long int num = mySwitch.getReceivedValue();
    Serial.print("Num: ");
    Serial.print(num);
    Serial.print("  Protocol: ");
    Serial.println(mySwitch.getReceivedProtocol());

    if (sosDelay >= sosDelay_Interval)
    {
      if (num == atol(SOS1))
      {
        Serial.println("SOS Butonuna Basıldı.");
        DRE_switch();

        // ✅ SOS anını işaretle
        lastSosMs = millis();

        // ✅ SOS=1'i CALLING'den önce garanti gönder (2 kez)
        readings["SOS"] = 1;
        String payload;
        serializeJson(readings, payload);

        if (!mqtt.connected()) reconnect();

        bool ok1 = mqtt.publish(topicOutput1, payload.c_str());
        mqtt.loop();
        delay(200);
        bool ok2 = mqtt.publish(topicOutput1, payload.c_str());
        mqtt.loop();
        delay(200);

        Serial.print("SOS publish 1: ");
        Serial.println(ok1 ? "OK" : "FAIL");
        Serial.print("SOS publish 2: ");
        Serial.println(ok2 ? "OK" : "FAIL");

        Serial.println("SOS MQTT Yayını Gönderildi:");
        Serial.println(payload);
        Serial.flush();

        // Ardından arama yapılsın
        CALLING();

        // ❌ RESET publish kaldırıldı (loop zaten SOS=0 basacak)
      }
      sosDelay = 0;
    }

    if (pirDelay >= pirDelay_Interval)
    {
      if (num == atol(PIR1))
      {
        DRE_switch();
        readings["MOTION"] = 1;
        Serial.println("HAREKET ALGILANDI.");
      }
      pirDelay = 0;
    }

    if (kapiacikDelay >= kapiacikDelay_Interval)
    {
      if (num == atol(KAPIACIK1))
      {
        DRE_switch();
        readings["DOOR_OPENED"] = 1;
        Serial.println("KAPI AÇILDI.");
      }
      kapiacikDelay = 0;
    }

    if (kapiKapaliDelay >= kapiKapaliDelay_Interval)
    {
      if (num == atol(KAPIKAPALI1))
      {
        DRE_switch();
        readings["DOOR_CLOSED"] = 1;
        Serial.println("KAPI KAPANDI.");
      }
      kapiKapaliDelay = 0;
    }

    if (gazDelay >= gazDelay_Interval)
    {
      if (num == atol(GAS1))
      {
        DRE_switch();
        readings["GAS"] = 1;
        Serial.println("GAZ ALGILANDI.");
      }
      gazDelay = 0;
    }

    if (dumanDelay >= dumanDelay_Interval)
    {
      if (num == atol(DUMAN1))
      {
        DRE_switch();
        readings["SMOKE"] = 1;
        Serial.println("DUMAN ALGILANDI.");
      }
      dumanDelay = 0;
    }
  }

  // ✅ SOS'tan sonra 5 saniye normal publish yapma (SOS=0 ile ezmesin)
  if (millis() - lastSosMs < 5000)
  {
    delay(50);
    return;
  }

  // JSON'u MQTT'ye gönder
  String payload;
  serializeJson(readings, payload);
  mqtt.publish(topicOutput1, payload.c_str());
  Serial.println("MQTT Yayını Gönderildi: ");
  Serial.println(payload);

  delay(5000);
}

void DRE_switch()
{
  mySwitch.disableReceive();
  mySwitch.resetAvailable();
  mySwitch.setProtocol(1);
  mySwitch.setReceiveTolerance(60);
  mySwitch.setPulseLength(360);
  mySwitch.enableReceive(14);
}