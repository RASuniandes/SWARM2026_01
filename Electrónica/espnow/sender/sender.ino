#include <esp_now.h> 
#include <WiFi.h> 
#include <ArduinoJson.h> 

#define JOYSTICK_X_AXIS_PORT 0 
#define JOYSTICK_Y_AXIS_PORT 1
#define JOYSTICK_BUTTON_PORT 21 
uint8_t receiverAddress[] = {0xdc, 0xda, 0x0c, 0x22, 0x85, 0x78}; // LOOK FOR ADDR 
esp_now_peer_info_t peerInfo; 
String sta; 
volatile int Y_value;
volatile int X_value;
volatile int button_value;

//void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) { 
void OnDataSent(const esp_now_send_info_t *info, esp_now_send_status_t status) {

  if(status == ESP_NOW_SEND_SUCCESS) 
  sta="Delivery Success"; else sta="Delivery Fail"; 
  Serial.println(sta); 
} 
void setup() { 
  Serial.begin(115200); 
  pinMode(JOYSTICK_X_AXIS_PORT, INPUT); 
  pinMode(JOYSTICK_Y_AXIS_PORT, INPUT); 
  pinMode(JOYSTICK_BUTTON_PORT, INPUT_PULLUP); 
  WiFi.mode(WIFI_STA); 
  esp_now_init(); 
  esp_now_register_send_cb(OnDataSent); // Register peer 
  memcpy(peerInfo.peer_addr, receiverAddress, 6); 
  peerInfo.channel = 0; peerInfo.encrypt = false; 
  esp_now_add_peer(&peerInfo); 
  Serial.println("Everything setup"); 
} 
void loop() { 
  Y_value = ((analogRead(JOYSTICK_Y_AXIS_PORT) / 2048.0) - 1) * 100; // From -100 to 100
  X_value = ((analogRead(JOYSTICK_X_AXIS_PORT) / 2048.0) - 1) * 100; // From -100 to 100
  Serial.print(analogRead(JOYSTICK_Y_AXIS_PORT));
  button_value = !digitalRead(JOYSTICK_BUTTON_PORT);
  StaticJsonDocument<200> doc;
  doc["xSpeed"] = X_value;
  doc["ySpeed"] = Y_value;
  int x = doc["xSpeed"];
  int y = doc["ySpeed"];
  if (abs(x) < 20) {
    doc["xSpeed"] = 0;
  }
  if (abs(y) < 20) {
    doc["ySpeed"] = 0;
  }
  if (button_value == 1) {
    doc["xSpeed"] = "G";
  }
  
  // Serialize JSON to buffer
  char buffer[200];
  size_t len = serializeJson(doc, buffer);

  esp_now_send(receiverAddress, (uint8_t *)buffer, len); 
  Serial.printf("X: %d, Y: %d, B: %d\n", X_value, Y_value, button_value); 
  delay(200); 
}
