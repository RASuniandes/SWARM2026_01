#include <WiFi.h>
#include <ESPAsyncWebServer.h>

// =========================
// WiFi
// =========================
const char *ssid = "SSID-HERE";
const char *password = "PASSWORD-HERE";

AsyncWebServer server(80);

// =========================
// Pines del encoder
// =========================
#define EncoderPinA 4
#define EncoderPinB 5

volatile long ticksEncoder1 = 0;

// =========================
// Pines del motor
// =========================
#define motor1A 8
#define motor1B 7
#define motor1_PWM 9

// =========================
// Configuración PWM
// =========================
// En ESP32 normalmente es mejor usar LEDC
const int pwmChannel = 0;
const int pwmFreq = 20000;
const int pwmResolution = 8;   // rango 0 a 255

const int PWM_BAJO = 90;
const int PWM_ALTO = 200;

// =========================
// Variables de velocidad
// =========================
unsigned long tAnterior = 0;
const unsigned long periodo = 100;   // ms

float omega = 0.0;
float rpm = 0.0;

long ticksPrevios = 0;

String estadoMotor = "Detenido";
int pwmActual = 0;

// =========================
// ISR encoder
// =========================
void IRAM_ATTR Encoder1A_ISR() {
  if (digitalRead(EncoderPinB) == HIGH) {
    ticksEncoder1++;
  } else {
    ticksEncoder1--;
  }
}

// =========================
// Funciones de motor
// =========================
void motorAdelante(int pwm) {
  digitalWrite(motor1A, HIGH);
  digitalWrite(motor1B, LOW);
  estadoMotor = "Adelante";
  pwmActual = pwm;
}

void motorAtras(int pwm) {
  digitalWrite(motor1A, LOW);
  digitalWrite(motor1B, HIGH);
  estadoMotor = "Atrás";
  pwmActual = pwm;
}

void motorDetener() {
  digitalWrite(motor1A, LOW);
  digitalWrite(motor1B, LOW);
  estadoMotor = "Detenido";
  pwmActual = 0;
}

// =========================
// Página web
// =========================
String paginaHTML() {
  long ticksCopia;
  noInterrupts();
  ticksCopia = ticksEncoder1;
  interrupts();

  String html = "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<meta http-equiv='refresh' content='2'>";
  html += "<title>Control Motor DC</title>";
  html += "</head><body>";

  html += "<h1>Control Motor DC por WiFi</h1>";
  html += "<p><a href=\"/forward500\"><button>Adelante baja</button></a></p>";
  html += "<p><a href=\"/forward2000\"><button>Adelante alta</button></a></p>";
  html += "<p><a href=\"/backward500\"><button>Atras baja</button></a></p>";
  html += "<p><a href=\"/backward2000\"><button>Atras alta</button></a></p>";
  html += "<p><a href=\"/stop\"><button>Detener</button></a></p>";

  html += "<hr>";
  html += "<p><b>Estado:</b> " + estadoMotor + "</p>";
  html += "<p><b>PWM actual:</b> " + String(pwmActual) + "</p>";
  html += "<p><b>Ticks acumulados:</b> " + String(ticksCopia) + "</p>";
  html += "<p><b>RPM:</b> " + String(rpm, 2) + "</p>";
  html += "<p><b>Omega:</b> " + String(omega, 2) + " rad/s</p>";

  html += "</body></html>";
  return html;
}

void setup() {
  Serial.begin(115200);

  // =========================
  // Configuración del encoder
  // =========================
  pinMode(EncoderPinA, INPUT_PULLUP);
  pinMode(EncoderPinB, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(EncoderPinA), Encoder1A_ISR, RISING);

  tAnterior = millis();

  // =========================
  // Configuración del motor
  // =========================
  pinMode(motor1A, OUTPUT);
  pinMode(motor1B, OUTPUT);


  motorDetener();

  // =========================
  // Conexión WiFi
  // =========================
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: http://");
  Serial.println(WiFi.localIP());

  // =========================
  // Rutas del servidor - Ni idea si asi es como lo vamos a hacer.
  // =========================
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/html", paginaHTML());
  });

  server.on("/forward500", HTTP_GET, [](AsyncWebServerRequest *request) {
    motorAdelante(PWM_BAJO);
    request->send(200, "text/html", paginaHTML());
  });

  server.on("/forward2000", HTTP_GET, [](AsyncWebServerRequest *request) {
    motorAdelante(PWM_ALTO);
    request->send(200, "text/html", paginaHTML());
  });

  server.on("/backward500", HTTP_GET, [](AsyncWebServerRequest *request) {
    motorAtras(PWM_BAJO);
    request->send(200, "text/html", paginaHTML());
  });

  server.on("/backward2000", HTTP_GET, [](AsyncWebServerRequest *request) {
    motorAtras(PWM_ALTO);
    request->send(200, "text/html", paginaHTML());
  });

  server.on("/stop", HTTP_GET, [](AsyncWebServerRequest *request) {
    motorDetener();
    request->send(200, "text/html", paginaHTML());
  });

  server.begin();
}

void loop() {
  unsigned long tActual = millis();

  if (tActual - tAnterior >= periodo) {
    long ticksActuales;

    noInterrupts();
    ticksActuales = ticksEncoder1;
    interrupts();

    long deltaTicks = ticksActuales - ticksPrevios;
    float dt = (tActual - tAnterior) / 1000.0;

    ticksPrevios = ticksActuales;
    tAnterior = tActual;

    float vueltas = deltaTicks / 12.0;   // 12 pulsos = 1 vuelta
    omega = (vueltas * 2.0 * PI) / dt;
    rpm = (vueltas / dt) * 60.0;

    Serial.print("Estado: ");
    Serial.print(estadoMotor);
    Serial.print(" | PWM: ");
    Serial.print(pwmActual);
    Serial.print(" | Omega(rad/s): ");
    Serial.print(omega);
    Serial.print(" | RPM: ");
    Serial.print(rpm);
    Serial.print(" | Ticks: ");
    Serial.println(ticksActuales);
  }

  // =========================
  // Control por ticks
  // =========================
  // Esto estaba antes, lo dejo por si acaso
  //if (ticksEncoder1 >= 1800) {
  //  motorAtras(PWM_BAJO);
  //}
  //else if (ticksEncoder1 <= -1800) {
  //  motorAdelante(PWM_BAJO);
  //}
  //*/

  delay(20);
}