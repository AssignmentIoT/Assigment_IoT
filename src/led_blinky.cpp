#include "led_blinky.h"
#include <WiFi.h>

// blink logic driven by network connectivity and measured temperature
void led_blinky(void *pvParameters){
  pinMode(LED_GPIO, OUTPUT);
  
  while(1) {
    // quick flash when WiFi is down
    if (WiFi.status() != WL_CONNECTED) {
      digitalWrite(LED_GPIO, HIGH);
      vTaskDelay(200 / portTICK_PERIOD_MS);
      digitalWrite(LED_GPIO, LOW);
      vTaskDelay(200 / portTICK_PERIOD_MS);
      continue;
    }

    // CASE 1: Normal operating temperature (Below 30°C)
    if(glob_temperature < 30.0) {
      digitalWrite(LED_GPIO, HIGH);  
      vTaskDelay(5000 / portTICK_PERIOD_MS); // LED ON for 5 seconds
      digitalWrite(LED_GPIO, LOW);  
      vTaskDelay(5000 / portTICK_PERIOD_MS); // LED OFF for 5 seconds
    }
    
    // CASE 2: Elevated temperature (Between 30°C and 60°C)
    else if(glob_temperature < 60.0) {
      digitalWrite(LED_GPIO, HIGH);  
      vTaskDelay(2000 / portTICK_PERIOD_MS); // LED ON for 2 seconds
      digitalWrite(LED_GPIO, LOW);  
      vTaskDelay(2000 / portTICK_PERIOD_MS); // LED OFF for 2 seconds
    }
    
    // CASE 3: Critical/High temperature (Above 60°C)
    else {
      digitalWrite(LED_GPIO, HIGH);  
      vTaskDelay(500 / portTICK_PERIOD_MS);  // LED ON for 0.5 seconds
      digitalWrite(LED_GPIO, LOW);  
      vTaskDelay(500 / portTICK_PERIOD_MS);  // LED OFF for 0.5 seconds
    }
  }
}
