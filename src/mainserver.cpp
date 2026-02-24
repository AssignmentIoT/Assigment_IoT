#include "mainserver.h"
#include <WiFi.h>
#include <LittleFS.h>
#include "task_check_info.h" 
#include "task_webserver.h" // Để gọi Webserver_reconnect()
#include "task_wifi.h"      // Để gọi startAP() và startSTA()

bool isAPMode = false; 

void connectToWiFi() {
  // 1. Check WiFi information in memory
  if (WIFI_SSID.isEmpty() || WIFI_SSID == "NULL") {
    Serial.println("⚠️ No SSID, Switching to AP mode...");
    startAP();
    isAPMode = true;
    return;
  }

  // 2. Connect to WiFi home (STA Mode)
  WiFi.mode(WIFI_STA);
  Serial.printf("📡 Connecting to WiFi: %s\n", WIFI_SSID.c_str());
  
  if (WIFI_PASS.isEmpty()) {
    WiFi.begin(WIFI_SSID.c_str());
  } else {
    WiFi.begin(WIFI_SSID.c_str(), WIFI_PASS.c_str());
  }

  // Wait 15s for connection, if fail, switch to AP mode
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    vTaskDelay(pdMS_TO_TICKS(500)); // Sử dụng vTaskDelay thay vì delay() để tốt cho FreeRTOS
    Serial.print('.');
  }

  // 3. Checking connection result
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connect successfully!");
    Serial.print("🌐 IP: ");
    Serial.println(WiFi.localIP());
    isAPMode = false;
  } else {
    Serial.println("\n❌ Connection failed, opening AP to reconfigure.");
    startAP();
    isAPMode = true;
  }
}

void main_server_task(void *pvParameters) {
  Serial.println("🚀 Main Server Task starting...");

  connectToWiFi();
  connnectWSV(); 

  while (1) {
    // Maintain Webserver/WebSocket 
    Webserver_reconnect();

    // Check BOOT button status to switch between AP and STA mode
    if (digitalRead(BOOT_PIN) == LOW) {
      vTaskDelay(pdMS_TO_TICKS(2000)); // Nhấn giữ 2 giây
      if (digitalRead(BOOT_PIN) == LOW) {
        Serial.println("🔄 Switching to AP mode...");
        startAP();
        isAPMode = true;
      }
    }

    vTaskDelay(pdMS_TO_TICKS(1000)); 
  }
}