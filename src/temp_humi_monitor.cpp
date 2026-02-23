#include "temp_humi_monitor.h"
DHT20 dht20;
LiquidCrystal_I2C lcd(33,16,2);


// void temp_humi_monitor(void *pvParameters){

//     Wire.begin(11, 12);
//     Serial.begin(115200);
//     dht20.begin();

//     while (1){
//         /* code */
        
//         dht20.read();
//         // Reading temperature in Celsius
//         float temperature = dht20.getTemperature();
//         // Reading humidity
//         float humidity = dht20.getHumidity();

        

//         // Check if any reads failed and exit early
//         if (isnan(temperature) || isnan(humidity)) {
//             Serial.println("Failed to read from DHT sensor!");
//             temperature = humidity =  -1;
//             //return;
//         }

//         //Update global variables for temperature and humidity
//         glob_temperature = temperature;
//         glob_humidity = humidity;

//         // Print the results
        
//         Serial.print("Humidity: ");
//         Serial.print(humidity);
//         Serial.print("%  Temperature: ");
//         Serial.print(temperature);
//         Serial.println("°C");
        
//         vTaskDelay(5000);
//     }
    
// }


void temp_humi_monitor2(void *pvParameters) {

    Serial.begin(115200);
    // Initialize I2C and Sensor
    Wire.begin(11, 12);
    dht20.begin();
    
    // Initialize LCD
    lcd.begin();
    lcd.backlight();
    lcd.clear();

    SensorData data;

    while (1) {
        dht20.read();
        data.temperature = dht20.getTemperature();
        data.humidity = dht20.getHumidity();

        // Error Handling State
        if (isnan(data.temperature) || isnan(data.humidity)) {
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Sensor Error!");
            vTaskDelay(5000);
            continue; 
        }

        // Send data to WebSocket
        String json = "{\"page\":\"sensor\",\"temperature\":" + String(data.temperature, 1) + 
              ",\"humidity\":" + String(data.humidity, 1) + "}";
              
        Webserver_sendata(json);
        // Update data to queue
        xQueueOverwrite(sensorQueue, &data);

        // Determine State and Update LCD
        lcd.setCursor(0, 0);
        lcd.print("T:");
        lcd.print(data.temperature, 1);
        lcd.print("C  H:");
        lcd.print(data.humidity, 1);
        lcd.print("% ");

        lcd.setCursor(0, 1); // Move to second line for Status
        
        if (data.temperature < 30.0) {
            // NORMAL STATE
            lcd.print("Status: NORMAL  "); 
        } 
        else if (data.temperature < 50.0) {
            // WARNING STATE
            lcd.print("Status: WARNING ");
        } 
        else {
            // CRITICAL STATE
            lcd.print("Status: CRITICAL!");
        }

        // Serial Debugging
        Serial.print("Humidity: ");
        Serial.print(data.humidity);
        Serial.print("%  Temperature: ");
        Serial.print(data.temperature);
        Serial.println("°C");
        
        vTaskDelay(5000);
    }
}