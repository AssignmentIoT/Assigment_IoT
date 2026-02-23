#include "neo_blinky.h"


void neo_blinky(void *pvParameters){

    Adafruit_NeoPixel strip(LED_COUNT, NEO_PIN, NEO_GRB + NEO_KHZ800);
    strip.begin();
    // Set all pixels to off to start
    strip.clear();
    strip.show();

    while(1) {                          
        strip.setPixelColor(0, strip.Color(255, 0, 0)); // Set pixel 0 to red
        strip.show(); // Update the strip

        // Wait for 500 milliseconds
        vTaskDelay(500);

        // Set the pixel to off
        strip.setPixelColor(0, strip.Color(0, 0, 0)); // Turn pixel 0 off
        strip.show(); // Update the strip

        // Wait for another 500 milliseconds
        vTaskDelay(500);
    }
}

/**
 * @brief Task to control a NeoPixel LED as a visual humidity indicator.
 * * BEHAVIOR:
 * The LED color transitions linearly from Pure Blue (0% humidity) 
 * to Pure Red (100% humidity). 
 * Blinking Cycle: 2-second period (1000ms ON / 1000ms OFF) to indicate the task is running.
 */
void neo_blinky2(void *pvParameters) {
    Adafruit_NeoPixel strip(LED_COUNT, NEO_PIN, NEO_GRB + NEO_KHZ800);
    strip.begin();
    strip.clear();
    strip.show();
    SensorData data;

    while(1) {
        // --- STEP 1: CALCULATE COLOR RATIO (0.0 to 1.0) ---
        xQueuePeek(sensorQueue, &data, 0); // Read the latest sensor data from the queue
      
        // Calculate the ratio
        // At 0%: ratio = 0.0 (Pure Blue)
        // At 100%: ratio = 1.0 (Pure Red)
        float ratio = data.humidity / 100.0;

        // Red channel follows the ratio: $Red = 255 * ratio$
        // Blue channel is the inverse: $Blue = 255 * (1.0 - ratio)$
        uint8_t redVal  = (uint8_t)(255 * ratio);
        uint8_t blueVal = (uint8_t)(255 * (1.0 - ratio));
        uint8_t greenVal = 0; // Keep green at 0 to maintain color saturation

        // --- STEP 2: EXECUTE BLINKING BEHAVIOR ---

        // State: LED ON with calculated RGB color
        strip.setPixelColor(0, strip.Color(redVal, greenVal, blueVal));
        strip.show();
        vTaskDelay(1000); 

        // State: LED OFF (Visual "heartbeat" effect)
        strip.setPixelColor(0, strip.Color(0, 0, 0));
        strip.show();
        vTaskDelay(1000); 
    }
}