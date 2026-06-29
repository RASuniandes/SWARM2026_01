#include <micro_ros_arduino.h>
#include <rcl/rcl.h>
#include <rclc/rclc.h>
#include <rclc/executor.h>
#include <std_msgs/msg/string.h>
#include <Adafruit_NeoPixel.h>
#define LED_PIN 48
#define LED_COUNT 128
#define MATRIX_WIDTH 8
#define MATRIX_HEIGHT 8
bool change=false;
String original="";
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
void fixZigZagMatrix(uint8_t input[8][8], uint8_t output[8][8]) {
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (y % 2 == 1) {
        output[y][x] = input[y][7 - x];
      } else {
        output[y][x] = input[y][x];
      }
    }
  }
}
int XY(uint8_t x, uint8_t y, uint8_t matrix) {
  int baseOffset = matrix * MATRIX_WIDTH * MATRIX_HEIGHT;
  if (y % 2 == 0)//OFFSET 2ND MATRIX (0,1)
    return baseOffset + y * MATRIX_WIDTH + x;
  else
    return baseOffset + y * MATRIX_WIDTH + (MATRIX_WIDTH - 1 - x);
} 
void clearMatrix() { //Nuke it
  strip.clear();
  strip.show();
}
void showArrowLeft() {
  uint32_t orange = strip.Color(255, 100, 0);
  uint8_t arrow[8][8] = {
    {0,0,0,1,0,0,0,0},
    {0,0,1,0,0,0,0,0},
    {0,1,0,0,0,0,0,0},
    {1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1},
    {0,1,0,0,0,0,0,0},
    {0,0,1,0,0,0,0,0},
    {0,0,0,1,0,0,0,0}
  };
  uint8_t fixed[8][8];
  fixZigZagMatrix(arrow, fixed);
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed[y][x])
        strip.setPixelColor(XY(x, y,1), orange);
    }
  }
  strip.show();
}
void diagonal(int section) {
  uint32_t orange = strip.Color(255, 100, 0);
  uint8_t arrow[8][8] = {
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0},
    {1,0,0,0,0,0,0,0}};
  uint8_t fixed[8][8];
  fixZigZagMatrix(arrow, fixed);
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed[y][x])
        strip.setPixelColor(XY(x, y,section), orange);
    }
  }
  strip.show();
}

void showArrowRight() {
  uint32_t orange = strip.Color(255, 100, 0);
  uint8_t arrow[8][8] = {
    {0,0,0,0,1,0,0,0},
    {0,0,0,0,0,1,0,0},
    {0,0,0,0,0,0,1,0},
    {1,1,1,1,1,1,1,1},
    {1,1,1,1,1,1,1,1},
    {0,0,0,0,0,0,1,0},
    {0,0,0,0,0,1,0,0},
    {0,0,0,0,1,0,0,0}
  };
  uint8_t fixed[8][8];
  fixZigZagMatrix(arrow, fixed);

  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed[y][x])
        strip.setPixelColor(XY(x, y,0), orange);
    }
  }
  strip.show();
}
void ojitos(){
  uint32_t green = strip.Color(0, 255, 0);
  uint8_t arrow1[8][8] = {
    {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,1,0,0,0,0,1,0},
  {0,0,1,0,0,1,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0}
  };
  uint8_t arrow2[8][8] = {
    {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,1,0,0,0,0,1,0},
  {0,0,1,0,0,1,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0}
  };
  uint8_t fixed1[8][8];
  uint8_t fixed2[8][8];
  fixZigZagMatrix(arrow1, fixed1);
  fixZigZagMatrix(arrow2, fixed2);

  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed1[y][x])
        strip.setPixelColor(XY(x, y,0), green);
    }
  }
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed2[y][x])
        strip.setPixelColor(XY(x, y,1), green);
    }
  }
  strip.show();
}
void ojitosazul(){
  uint32_t green = strip.Color(0, 0, 255);
  uint8_t arrow1[8][8] = {
    {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,1,0,0,0,0,1,0},
  {0,0,1,0,0,1,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0}
  };
  uint8_t arrow2[8][8] = {
    {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,1,0,0,0,0,1,0},
  {0,0,1,0,0,1,0,0},
  {0,0,0,1,1,0,0,0},
  {0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0}
  };
  uint8_t fixed1[8][8];
  uint8_t fixed2[8][8];
  fixZigZagMatrix(arrow1, fixed1);
  fixZigZagMatrix(arrow2, fixed2);

  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed1[y][x])
        strip.setPixelColor(XY(x, y,0), green);
    }
  }
  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed2[y][x])
        strip.setPixelColor(XY(x, y,1), green);
    }
  }
  strip.show();
}
void ojosPreocupados() {
  uint32_t red = strip.Color(255, 0, 0);
  uint8_t eyes1[8][8] = {
    {0,0,0,0,0,0,0,0},
    {0,0,1,0,0,1,0,0},
    {0,1,0,1,1,0,1,0},
    {0,0,1,0,0,1,0,0},
    {0,0,0,1,1,0,0,0},
    {0,0,0,0,0,0,0,0},
    {0,0,0,0,0,0,0,0},
    {0,0,0,0,0,0,0,0}
  };

  uint8_t eyes2[8][8] = {
    {0,0,0,0,0,0,0,0},
    {0,0,1,0,0,1,0,0},
    {0,1,0,1,1,0,1,0},
    {0,0,1,0,0,1,0,0},
    {0,0,0,1,1,0,0,0},
    {0,0,0,0,0,0,0,0},
    {0,0,0,0,0,0,0,0},
    {0,0,0,0,0,0,0,0}
  };

  uint8_t fixed1[8][8];
  uint8_t fixed2[8][8];
  fixZigZagMatrix(eyes1, fixed1);
  fixZigZagMatrix(eyes2, fixed2);

  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed1[y][x])
        strip.setPixelColor(XY(x, y, 0), red);
    }
  }

  for (int y = 0; y < 8; y++) {
    for (int x = 0; x < 8; x++) {
      if (fixed2[y][x])
        strip.setPixelColor(XY(x, y, 1), red);
    }
  }

  strip.show();
}
rcl_subscription_t subscriber;
std_msgs__msg__String msg;
char msg_buffer[50];//TRANSPORT MEMORY ALLOCATOR (&50&)
rcl_allocator_t allocator;
rclc_support_t support;
rcl_node_t node;
rclc_executor_t executor;
void subscription_callback(const void *msgin) {
  const std_msgs__msg__String *incoming_msg = (const std_msgs__msg__String *)msgin;
  if (incoming_msg->data.data == NULL) return;
  String data = String(incoming_msg->data.data);
  data.trim();
  Serial.print("REC:");
  Serial.println(data);
  if (original==data){
    Serial.println("nor");
  }
  else{
    clearMatrix();
  }
  if (data == "left") {
    showArrowLeft();
  } else if (data == "right") {
    showArrowRight();
  } else if (data == "front") {
    ojitosazul();
  } else if (data=="back"){
    ojosPreocupados();
  }
  else if (data == "greet") {
    saludar();
  }
  
  else{
    ojitos();
  }
  original=data;
}
void setup() {
  Serial.begin(115200);
  delay(2000);
  strip.begin();
  strip.setBrightness(255);
  strip.show();

  Serial.println("[micro-ROS] Initializing WiFi transport...");
  set_microros_wifi_transports("RASputin", "ABCDABC4", "192.168.0.108", 8888);
  //set_microros_transports(); //OTG 115200
  allocator = rcl_get_default_allocator();
  rclc_support_init(&support, 0, NULL, &allocator);

  rclc_node_init_default(&node, "faces_node", "", &support);
  msg.data.data = msg_buffer;
  msg.data.size = 0;
  msg.data.capacity = sizeof(msg_buffer);
  rclc_subscription_init_default(
    &subscriber,
    &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(std_msgs, msg, String),
    "/faces_direction" //ROUT OUTPUT(M1)
  );
  rclc_executor_init(&executor, &support.context, 1, &allocator);
  rclc_executor_add_subscription(&executor, &subscriber, &msg, &subscription_callback, ON_NEW_DATA);

  Serial.println("TRCPSA READY - faces_node ready.");
  showArrowLeft();
  delay(3000);
  clearMatrix();
  showArrowRight();
  delay(3000);
  clearMatrix();
  ojitos();
}
void loop() {
  rclc_executor_spin_some(&executor, RCL_MS_TO_NS(100));
  delay(100);
}
