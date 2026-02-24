#ifndef ___MAIN_SERVER__
#define ___MAIN_SERVER__
#include <Arduino.h>
#include <WiFi.h>
#include "global.h"  // wifi vars
#include "task_webserver.h"  // use AsyncWebServer routes

#define LED1_PIN 48
#define LED2_PIN 41
#define BOOT_PIN 0
//extern WebServer server;

extern bool isAPMode; // true when configuration AP is active

void startAP();
void setupServer();
void connectToWiFi();

void main_server_task(void *pvParameters);

#endif