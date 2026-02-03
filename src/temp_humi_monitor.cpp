#include "temp_humi_monitor.h"
DHT20 dht20;
LiquidCrystal_I2C lcd(33,16,2);


void temp_humi_monitor(void *pvParameters){

    Wire.begin(11, 12);
    Serial.begin(115200);
    dht20.begin();

    while (1){
        /* code */
        
        dht20.read();
        // Reading temperature in Celsius
        float temperature = dht20.getTemperature();
        // Reading humidity
        float humidity = dht20.getHumidity();

        

        // Check if any reads failed and exit early
        if (isnan(temperature) || isnan(humidity)) {
            Serial.println("Failed to read from DHT sensor!");
            temperature = humidity =  -1;
            //return;
        }

        //Update global variables for temperature and humidity
        glob_temperature = temperature;
        glob_humidity = humidity;

        // Print the results
        
        Serial.print("Humidity: ");
        Serial.print(humidity);
        Serial.print("%  Temperature: ");
        Serial.print(temperature);
        Serial.println("°C");
        
        vTaskDelay(5000);
    }
    
}


void temp_humi_monitor2(void *pvParameters) {

    Serial.begin(115200);
    // Initialize I2C and Sensor
    Wire.begin(11, 12);
    dht20.begin();
    
    // Initialize LCD
    lcd.begin();
    lcd.backlight();
    lcd.clear();

    while (1) {
        dht20.read();
        float temperature = dht20.getTemperature();
        float humidity = dht20.getHumidity();

        // Error Handling State
        if (isnan(temperature) || isnan(humidity)) {
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Sensor Error!");
            vTaskDelay(5000);
            continue; 
        }

        // Update Globals
        glob_temperature = temperature;
        glob_humidity = humidity;

        // Determine State and Update LCD
        lcd.setCursor(0, 0);
        lcd.print("T:");
        lcd.print(temperature, 1);
        lcd.print("C  H:");
        lcd.print(humidity, 1);
        lcd.print("% ");

        lcd.setCursor(0, 1); // Move to second line for Status
        
        if (temperature < 30.0) {
            // NORMAL STATE
            lcd.print("Status: NORMAL  "); 
        } 
        else if (temperature >= 30.0 && temperature < 40.0) {
            // WARNING STATE
            lcd.print("Status: WARNING ");
        } 
        else {
            // CRITICAL STATE
            lcd.print("Status: CRITICAL!");
        }

        // Serial Debugging
        Serial.print("Humidity: ");
        Serial.print(humidity);
        Serial.print("%  Temperature: ");
        Serial.print(temperature);
        Serial.println("°C");
        
        vTaskDelay(5000);
    }
}