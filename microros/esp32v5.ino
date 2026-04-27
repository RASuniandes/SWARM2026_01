#include <micro_ros_arduino.h>
#include <stdio.h>
#include <rcl/rcl.h>
#include <rclc/rclc.h>
#include <rclc/executor.h>
#include <std_msgs/msg/int32.h>
#include <geometry_msgs/msg/twist.h>
#include <Adafruit_NeoPixel.h>
#include <WiFi.h>
#include <std_msgs/msg/int32_multi_array.h>

extern "C" bool arduino_transport_open(struct uxrCustomTransport * transport)
{
  Serial2.begin(115200, SERIAL_8N1, 16, 17);  // RX, TX pins
  return true;
}

extern "C" bool arduino_transport_close(struct uxrCustomTransport * transport)
{
  Serial2.end();
  return true;
}

extern "C" size_t arduino_transport_write(struct uxrCustomTransport* transport,
                                          const uint8_t* buf,
                                          size_t len,
                                          uint8_t* err)
{
  return Serial2.write(buf, len);
}

extern "C" size_t arduino_transport_read(struct uxrCustomTransport* transport,
                                         uint8_t* buf,
                                         size_t len,
                                         int timeout,
                                         uint8_t* err)
{
  return Serial2.readBytes(buf, len);
}
#define LEFT_FWD 1
#define LEFT_BWD 2
#define RIGHT_FWD 11
#define RIGHT_BWD 12
#define WHEEL_BASE 0.20
#define ENC_LEFT_A 4
#define ENC_LEFT_B 5
#define ENC_RIGHT_A 13
#define ENC_RIGHT_B 14
volatile long ticks_left = 0;
volatile long ticks_right = 0;
Adafruit_NeoPixel debug(1, 48, NEO_GRB + NEO_KHZ800);
char ssid[] = "Aruba";
char password[] = "-";
char IPAddress[] ="192.168.50.229"; //ROCKCHIP
size_t agent_port = 8888;
#define MAX_SPEED 1.0
#define MAX_PWM   255
rcl_publisher_t publisher;
rcl_subscription_t subscriber;
rclc_executor_t executor;
rclc_support_t support;
rcl_allocator_t allocator;
rcl_node_t node;
rcl_timer_t timer;
std_msgs__msg__Int32MultiArray msg_pub;
geometry_msgs__msg__Twist cmd_msg;
int32_t somecounter = 0;
unsigned long last_cmd_time = 0;
void IRAM_ATTR encoder_left_isr(){if (digitalRead(ENC_LEFT_B) == HIGH) {ticks_left++;} 
                                  else {ticks_left--;}}//ATRIB-RAM SPECIFIED ENCODE
void IRAM_ATTR encoder_right_isr() {
  if (digitalRead(ENC_RIGHT_B) == HIGH) {
    ticks_right++;
  } else {
    ticks_right--;
  }
}
long get_right_ticks() {
  long value;
  noInterrupts();
  value = ticks_right;
  interrupts();
  return value;
}
long get_left_ticks() {
  long value;
  noInterrupts();
  value = ticks_left;
  interrupts();
  return value;
}
void stop_motors() {
  analogWrite(LEFT_FWD, 0);analogWrite(LEFT_BWD, 0);
  analogWrite(RIGHT_FWD, 0);analogWrite(RIGHT_BWD, 0);
}
void set_motor(float left, float right) {
  float left_norm  = left  / MAX_SPEED;
  float right_norm = right / MAX_SPEED;
  left_norm  = constrain(left_norm,  -1.0, 1.0);
  right_norm = constrain(right_norm, -1.0, 1.0);
  int left_pwm  = abs(left_norm)  * MAX_PWM;
  int right_pwm = abs(right_norm) * MAX_PWM;
  if (left_norm > 0) {analogWrite(LEFT_FWD, left_pwm);analogWrite(LEFT_BWD, 0);} 
  else if (left_norm < 0) {analogWrite(LEFT_FWD, 0);analogWrite(LEFT_BWD, left_pwm);} 
  else {analogWrite(LEFT_FWD, 0);analogWrite(LEFT_BWD, 0);}
  if (right_norm > 0) {analogWrite(RIGHT_FWD, right_pwm);analogWrite(RIGHT_BWD, 0);} 
  else if (right_norm < 0) {analogWrite(RIGHT_FWD, 0);analogWrite(RIGHT_BWD, right_pwm);} 
  else {analogWrite(RIGHT_FWD, 0);analogWrite(RIGHT_BWD, 0);}
}
void cmd_vel_callback(const void * msgin) {
  const geometry_msgs__msg__Twist * msg = (const geometry_msgs__msg__Twist *)msgin;
  float linear = msg->linear.x;
  float angular = msg->angular.z;
  float left  = linear - (angular * WHEEL_BASE / 2.0);
  float right = linear + (angular * WHEEL_BASE / 2.0);
  set_motor(left, right);
  last_cmd_time = millis();
  debug.setPixelColor(0, debug.Color(0, 0, 255));
  debug.show();
}
void timer_callback(rcl_timer_t * timer, int64_t last_call_time) {
  (void) last_call_time;

  if (timer != NULL) {
    msg_pub.data.data[0] = get_left_ticks();
    msg_pub.data.data[1] = get_right_ticks();

    rcl_publish(&publisher, &msg_pub, NULL);
  }
}

void setup() {
  debug.begin();
  debug.clear();
  debug.setPixelColor(0, debug.Color(255, 0, 0));
  debug.show();
  pinMode(ENC_LEFT_A, INPUT_PULLUP);
  pinMode(ENC_LEFT_B, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(ENC_LEFT_A), encoder_left_isr, RISING);
  msg_pub.data.data = (int32_t*) malloc(2 * sizeof(int32_t));
  msg_pub.data.size = 2;
  msg_pub.data.capacity = 2;
  //WiFi.begin(ssid, password);
  //while (WiFi.status() != WL_CONNECTED) {delay(500); debug.setPixelColor(0, debug.Color(196, 0, 255));debug.show();}
  //set_microros_wifi_transports(ssid, password, IPAddress, agent_port); //WIFI
  //set_microros_transports(); //USB-UART (TX/RX00)
  rmw_uros_set_custom_transport( //UART PINS
  true,
  NULL,
  arduino_transport_open,
  arduino_transport_close,
  arduino_transport_write,
  arduino_transport_read
);
  delay(2000);
  allocator = rcl_get_default_allocator();
  rclc_support_init(&support, 0, NULL, &allocator);
  //rclc_support_init_with_options(&support, 0, NULL, &allocator, NULL);
  rclc_node_init_default(&node, "ESP32S3MAIN", "", &support);
  rclc_publisher_init_best_effort(
    &publisher,
    &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(std_msgs, msg, Int32MultiArray),
    "encoder"
  );
  rclc_subscription_init_default(
    &subscriber,
    &node,
    ROSIDL_GET_MSG_TYPE_SUPPORT(geometry_msgs, msg, Twist),
    "cmd_vel"
  );
  rclc_timer_init_default(
    &timer,
    &support,
    RCL_MS_TO_NS(500),
    timer_callback
  );
  rclc_executor_init(&executor, &support.context, 2, &allocator);
  rclc_executor_add_subscription(
    &executor,
    &subscriber,
    &cmd_msg,
    &cmd_vel_callback,
    ON_NEW_DATA
  );
  rclc_executor_add_timer(&executor, &timer);
}

void loop() {
  rclc_executor_spin_some(&executor, RCL_MS_TO_NS(5));
  if (millis() - last_cmd_time > 500) {
    stop_motors();
    debug.setPixelColor(0, debug.Color(255, 255, 0));
    debug.show();
  }
}