// === Pines del encoder ===
#define EncoderPinA 4   // Canal A -> GPIO4
#define EncoderPinB 5   // Canal B -> GPIO5

volatile long ticksEncoder1 = 0;

// === Pines de motor (comentados, no usados aquí) ===
// #define motor1A 8
// #define motor1B 7
// #define motor1_PWM 9   // PWM velocidad

// ISR: interrupción del canal A
void IRAM_ATTR Encoder1A_ISR() {
  if (digitalRead(EncoderPinB) == HIGH) {
    ticksEncoder1++;
  } else {
    ticksEncoder1--;
  }
}

void setup() {
  Serial.begin(115200);

  // Configuración del encoder
  pinMode(EncoderPinA, INPUT_PULLUP);
  pinMode(EncoderPinB, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(EncoderPinA), Encoder1A_ISR, RISING);
  // Si quieres mayor resolución, cámbialo por CHANGE

  // === Configuración del motor (comentado) ===
  // pinMode(motor1A, OUTPUT);
  // pinMode(motor1B, OUTPUT);
  // pinMode(motor1_PWM, OUTPUT);
  // digitalWrite(motor1A, HIGH);
  // digitalWrite(motor1B, LOW);
}

void loop() {
  // === PWM motor (comentado) ===
  // analogWrite(motor1_PWM, 200);

  // === Control por ticks (comentado) ===
  // if (ticksEncoder1 >= 1800) {
  //   digitalWrite(motor1A, LOW);
  //   digitalWrite(motor1B, HIGH);
  // }
  // else if (ticksEncoder1 <= -1800) {
  //   digitalWrite(motor1A, HIGH);
  //   digitalWrite(motor1B, LOW);
  // }

  // Solo impresión de ticks
  Serial.print("Ticks encoder: ");
  Serial.println(ticksEncoder1);

  delay(50);
}
