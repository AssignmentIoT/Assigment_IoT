#include "led_blinky.h"

void led_blinky(void *pvParameters){
  pinMode(LED_GPIO, OUTPUT);
  
  while(1) {                        
    digitalWrite(LED_GPIO, HIGH);  // turn the LED ON
    vTaskDelay(1000);
    digitalWrite(LED_GPIO, LOW);  // turn the LED OFF
    vTaskDelay(1000);
  }
}

/**
 * @brief Task to control the warning LED based on system temperature.
 * * BEHAVIOR: 
 * The LED blinking frequency provides visual telemetry of the system's thermal state.
 * As the temperature increases, the blinking interval decreases to grab attention.
 */
void led_blinky2(void *pvParameters) {
  // Initialize the LED GPIO pin as an output
  pinMode(LED_GPIO, OUTPUT);
  
  while(1) {
    // CASE 1: Normal operating temperature (Below 30°C)
    if(glob_temperature < 30.0) {
      digitalWrite(LED_GPIO, HIGH);  
      vTaskDelay(5000); // LED ON for 5 seconds
      digitalWrite(LED_GPIO, LOW);  
      vTaskDelay(5000); // LED OFF for 5 seconds
    }
    
    // CASE 2: Elevated temperature (Between 30°C and 60°C)
    else if(glob_temperature < 60.0) {
      digitalWrite(LED_GPIO, HIGH);  
      vTaskDelay(2000); // LED ON for 2 seconds
      digitalWrite(LED_GPIO, LOW);  
      vTaskDelay(2000); // LED OFF for 2 seconds
    }
    
    // CASE 3: Critical/High temperature (Above 60°C)
    else {
      digitalWrite(LED_GPIO, HIGH);  
      vTaskDelay(500);  // LED ON for 0.5 seconds
      digitalWrite(LED_GPIO, LOW);  
      vTaskDelay(500);  // LED OFF for 0.5 seconds
    }
  }
}