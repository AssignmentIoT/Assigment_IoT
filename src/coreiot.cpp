#include "coreiot.h"

#include "global.h" // Bắt buộc include để gọi biến nhiệt độ và Semaphore
#include <ArduinoJson.h>

// ----------- CONFIGURE THESE! -----------
// 1. SỬA THÀNH SERVER CỦA COREIOT
const char* coreIOT_Server = "app.coreiot.io";  
// 2. ĐIỀN TOKEN CỦA SENSOR T1
const char* coreIOT_Token = "zwSI7RvTd2GoJxwRBEOT";   
const int   mqttPort = 1883;
// ----------------------------------------

WiFiClient espClient;
PubSubClient client(espClient);


void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Tạo ID ngẫu nhiên cho ESP32
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    // 3. QUAN TRỌNG: Truyền Token vào vị trí Username (tham số thứ 2)
    if (client.connect(clientId.c_str(), coreIOT_Token, NULL)) { 
      Serial.println("connected to CoreIOT Server!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      vTaskDelay(5000 / portTICK_PERIOD_MS); // Dùng vTaskDelay thay vì delay()
    }
  }
}


void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.println("] ");

  // Allocate a temporary buffer for the message
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';
  Serial.print("Payload: ");
  Serial.println(message);

  // Parse JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  const char* method = doc["method"];
  if (strcmp(method, "setStateLED") == 0) {
    // Check params type (could be boolean, int, or string according to your RPC)
    // Example: {"method": "setValueLED", "params": "ON"}
    const char* params = doc["params"];

    if (strcmp(params, "ON") == 0) {
      Serial.println("Device turned ON.");
      //TODO

    } else {   
      Serial.println("Device turned OFF.");
      //TODO

    }
  } else {
    Serial.print("Unknown method: ");
    Serial.println(method);
  }
}


void setup_coreiot(){
  // 4. CHỜ INTERNET TỪ TASK_WIFI.CPP
  Serial.println("CoreIOT Task is waiting for Internet...");
  while(1){
    if (xSemaphoreTake(xBinarySemaphoreInternet, portMAX_DELAY) == pdTRUE) {
      // Đã có internet, trả lại cờ cho task khác dùng
      xSemaphoreGive(xBinarySemaphoreInternet); 
      break;
    }
    vTaskDelay(500 / portTICK_PERIOD_MS);
  }

  Serial.println("Internet is ready! Setup CoreIOT...");
  client.setServer(coreIOT_Server, mqttPort);
}

void coreiot_task(void *pvParameters){
    setup_coreiot();

    while(1){
        if (!client.connected()) {
            reconnect();
        }
        client.loop();

        // 5. ĐÓNG GÓI JSON & GỬI DỮ LIỆU
        // Lấy giá trị từ biến glob_temperature và glob_humidity
        String payload = "{\"temperature\":" + String(glob_temperature) +  ",\"humidity\":" + String(glob_humidity) + "}";
        
        client.publish("v1/devices/me/telemetry", payload.c_str());
        
        Serial.println("Published payload: " + payload);
        
        // Gửi mỗi 10 giây
        vTaskDelay(10000 / portTICK_PERIOD_MS);  
    }
}
