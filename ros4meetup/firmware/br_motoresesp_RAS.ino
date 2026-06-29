#include <ArduinoJson.h>

String input;

void setup()
{
  Serial.begin(115200);
  Serial.println("ESP32 esperando JSON...");
}

void loop()
{
  if (Serial.available())
  {
    input = Serial.readStringUntil('\n'); // leer hasta salto de línea

    StaticJsonDocument<200> doc; // Buffer para el JSON
    DeserializationError error = deserializeJson(doc, input);

    if (!error)
    {
      const char *led = doc["led"];             // "on"
      int motor = doc["motor"];                 // 120
      const char *direccion = doc["direccion"]; // "adelante"

      Serial.print("LED: ");
      Serial.println(led);
      Serial.print("Motor: ");
      Serial.println(motor);
      Serial.print("Dirección: ");
      Serial.println(direccion);

      // Aquí puedes usar esos valores para mover motores o controlar pines
    }
    else
    {
      Serial.print("Error parseando JSON: ");
      Serial.println(error.c_str());
    }
  }
}

// ==== Pines para los motores (Drivers 8871) ====
#define SDA 15
#define SCL 16

// ==== Pines motores y encoders (definidos abajo para inicializar objetos) ====
#define M1_IN1 1
#define M1_IN2 2
#define ENC1_A 4
#define ENC1_B 5

#define M2_IN1 6
#define M2_IN2 7
#define ENC2_A 17
#define ENC2_B 18

#define M3_IN1 8
#define M3_IN2 3
#define ENC3_A 9
#define ENC3_B 10

#define M4_IN1 11
#define M4_IN2 12
#define ENC4_A 13
#define ENC4_B 14

// ==== Clase Motor con encoder ====
class Motor
{
private:
  int in1, in2;
  int ch1, ch2;
  int encA, encB;
  volatile long pulsos;
  long lastPulsos;
  float rpm;
  unsigned long lastTime;
  const int pulsosPorVuelta = 12;
  const float reduccion = 80.0;

public:
  Motor(int _in1, int _in2, int _ch1, int _ch2, int _encA, int _encB)
  {
    in1 = _in1;
    in2 = _in2;
    ch1 = _ch1;
    ch2 = _ch2;
    encA = _encA;
    encB = _encB;
    pulsos = 0;
    lastPulsos = 0;
    rpm = 0;
    lastTime = millis();
  }

  void init()
  {
    pinMode(in1, OUTPUT);
    pinMode(in2, OUTPUT);
    ledcSetup(ch1, 1000, 8);
    ledcAttachPin(in1, ch1);
    ledcSetup(ch2, 1000, 8);
    ledcAttachPin(in2, ch2);

    pinMode(encA, INPUT_PULLUP);
    pinMode(encB, INPUT_PULLUP);
    attachInterruptArg(digitalPinToInterrupt(encA), isrA, this, CHANGE);
    attachInterruptArg(digitalPinToInterrupt(encB), isrB, this, CHANGE);
  }

  void forward(int speed)
  {
    ledcWrite(ch1, speed);
    ledcWrite(ch2, 0);
  }

  void backward(int speed)
  {
    ledcWrite(ch1, 0);
    ledcWrite(ch2, speed);
  }

  void stop()
  {
    ledcWrite(ch1, 0);
    ledcWrite(ch2, 0);
  }

  void updateRPM()
  {
    unsigned long now = millis();
    if (now - lastTime >= 500)
    {
      long delta = pulsos - lastPulsos;
      float tiempoSeg = (now - lastTime) / 1000.0;
      rpm = (delta / (float)pulsosPorVuelta) * (60.0 / tiempoSeg) / reduccion;
      lastPulsos = pulsos;
      lastTime = now;
    }
  }

  float getRPM()
  {
    return rpm;
  }

  long getPulsos()
  {
    return pulsos;
  }

  void encoderChange(bool a, bool b)
  {
    if (a == b)
      pulsos++;
    else
      pulsos--;
  }

  // ISR static wrappers
  static void isrA(void *arg)
  {
    Motor *m = static_cast<Motor *>(arg);
    m->encoderChange(digitalRead(m->encA), digitalRead(m->encB));
  }

  static void isrB(void *arg)
  {
    Motor *m = static_cast<Motor *>(arg);
    m->encoderChange(digitalRead(m->encA), digitalRead(m->encB));
  }
};

// ==== Instancias ====
Motor motor1(M1_IN1, M1_IN2, 0, 1, ENC1_A, ENC1_B);
Motor motor2(M2_IN1, M2_IN2, 2, 3, ENC2_A, ENC2_B);
Motor motor3(M3_IN1, M3_IN2, 4, 5, ENC3_A, ENC3_B);
Motor motor4(M4_IN1, M4_IN2, 6, 7, ENC4_A, ENC4_B);

// ==== Setup ====
void setup()
{
  Serial.begin(115200);
  motor1.init();
  motor2.init();
  motor3.init();
  motor4.init();
  Serial.println("Motores con encoder inicializados.");
}

// ==== Movimiento simple ====
void moverAdelante(int v)
{
  motor1.forward(v);
  motor2.forward(v);
  motor3.forward(v);
  motor4.forward(v);
}

void detenerTodo()
{
  motor1.stop();
  motor2.stop();
  motor3.stop();
  motor4.stop();
}

// ==== Loop principal ====
void loop()
{
  static unsigned long lastPrint = 0;

  motor1.updateRPM();
  motor2.updateRPM();
  motor3.updateRPM();
  motor4.updateRPM();

  if (millis() - lastPrint > 1000)
  {
    Serial.print("RPM1: ");
    Serial.print(motor1.getRPM());
    Serial.print("\tRPM2: ");
    Serial.print(motor2.getRPM());
    Serial.print("\tRPM3: ");
    Serial.print(motor3.getRPM());
    Serial.print("\tRPM4: ");
    Serial.println(motor4.getRPM());
    lastPrint = millis();
  }

  moverAdelante(200);
  delay(2000);
  detenerTodo();
  delay(1000);
}
