#include <ArduinoJson.h>
#include <WiFi.h>
#include <esp_now.h>


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
#define M4_IN2 13
#define ENC4_A 13
#define ENC4_B 14

String input;
uint8_t senderAddress[] = {0x0c, 0x4e, 0xa0, 0x65, 0xaf, 0x30}; // ejemplo
int data[4] = {0, 0, 0, 0};

// ------------------------------------------------------------------

// ==== Callback ESP-NOW: firma compatible con esp_now_recv_cb_t ====
void OnDataRecv(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len)
{
    // info puede ser nullptr en algunas implementaciones; comprobarlo
    if (incomingData == nullptr || len <= 0)
        return;

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, incomingData, len);
    if (!error)
    {
        updateData(doc);
    }
    else
    {
        // opcional: imprimir error para debugging
        Serial.print("ESP-NOW Deserialize error: ");
        Serial.println(error.c_str());
    }
}


// ==== Clase Motor con encoder ====
class Motor
{
private:
    int in1, in2;
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

        // No ledcSetup, just prepare pins for analogWrite
        analogWrite(in1, 0);
        analogWrite(in2, 0);

        pinMode(encA, INPUT_PULLUP);
        pinMode(encB, INPUT_PULLUP);
        attachInterruptArg(digitalPinToInterrupt(encA), isrA, this, CHANGE);
        attachInterruptArg(digitalPinToInterrupt(encB), isrB, this, CHANGE);
    }

    void forward(int speed)
    {
        speed = (constrain(speed, 0, 100) / 100) * 255;
        analogWrite(in1, speed);
        analogWrite(in2, 0);
    }

    void backward(int speed)
    {
        speed = (constrain(speed, 0, 100) / 100) * 255;
        analogWrite(in1, 0);
        analogWrite(in2, speed);
    }

    void stop()
    {
        analogWrite(in1, 0);
        analogWrite(in2, 0);
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

    float getRPM() { return rpm; }
    long getPulsos() { return pulsos; }

    void encoderChange(bool a, bool b)
    {
        if (a == b)
            pulsos++;
        else
            pulsos--;
    }

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

// ==== Movimiento simple ====
void moveForward(int v)
{
    motor1.forward(v);
    motor2.forward(v);
    motor3.forward(v);
    motor4.forward(v);
}
void move(int v1, int v2, int v3, int v4)
{
    (v1 >= 0) ? motor1.forward(v1) : motor1.backward(-v1);
    (v2 >= 0) ? motor2.forward(v2) : motor2.backward(-v2);
    (v3 >= 0) ? motor3.forward(v3) : motor3.backward(-v3);
    (v4 >= 0) ? motor4.forward(v4) : motor4.backward(-v4);
}
void stopAll()
{
    motor1.stop();
    motor2.stop();
    motor3.stop();
    motor4.stop();
}
void handleStatus()
{
    motor1.updateRPM();
    motor2.updateRPM();
    motor3.updateRPM();
    motor4.updateRPM();

    StaticJsonDocument<200> doc;
    doc["rpm1"] = motor1.getRPM();
    doc["rpm2"] = motor2.getRPM();
    doc["rpm3"] = motor3.getRPM();
    doc["rpm4"] = motor4.getRPM();
    doc["pulsos1"] = motor1.getPulsos();
    doc["pulsos2"] = motor2.getPulsos();
    doc["pulsos3"] = motor3.getPulsos();
    doc["pulsos4"] = motor4.getPulsos();

    String response;
    serializeJson(doc, response);
}

void sendData()
{
    motor1.updateRPM();
    motor2.updateRPM();
    motor3.updateRPM();
    motor4.updateRPM();

    StaticJsonDocument<200> doc;
    doc["rpm1"] = motor1.getRPM();
    doc["rpm2"] = motor2.getRPM();
    doc["rpm3"] = motor3.getRPM();
    doc["rpm4"] = motor4.getRPM();
    doc["pulsos1"] = motor1.getPulsos();
    doc["pulsos2"] = motor2.getPulsos();
    doc["pulsos3"] = motor3.getPulsos();
    doc["pulsos4"] = motor4.getPulsos();

    char output[200];
    serializeJson(doc, output);
    Serial.println(output);
    // Si quieres enviar a una dirección concreta:
    esp_err_t res = esp_now_send(senderAddress, (uint8_t *)output, strlen(output));
    if (res != ESP_OK)
    {
        Serial.print("esp_now_send error: ");
        Serial.println(res);
    }
}

// ==== Setup ====
void setup()
{
    Serial.begin(115200);



    Serial.println(WiFi.localIP());


    // Initialize ESP-NOW
    WiFi.mode(WIFI_STA);
    delay(100);

    if (esp_now_init() != ESP_OK)
    {
        Serial.println("Error initializing ESP-NOW");
    }
    else
    {
        Serial.println("ESP-NOW initialized.");
    }

    // Registrar callback (firma compatible)
    esp_err_t r = esp_now_register_recv_cb(OnDataRecv);
    if (r != ESP_OK)
    {
        Serial.print("esp_now_register_recv_cb error: ");
        Serial.println(r);
    }

    // Añadir peer (si lo necesitas)
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, senderAddress, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    if (esp_now_add_peer(&peerInfo) != ESP_OK)
    {
        Serial.println("Failed to add peer");
    }

    motor1.init();
    motor2.init();
    motor3.init();
    motor4.init();

    Serial.println("Motores con encoder inicializados.");
}

// ==== updateData (por referencia) ====
void updateData(StaticJsonDocument<200> &doc)
{
    // y speed is the Y axis 
    // x speed is the X
    int y  = map(doc["ySpeed"] | doc["linear_speed"] | 0, -100, 100, -255, 255);

    
    int x = map(doc["xSpeed"] | 0, -100, 100, -255, 255);
    int theta = map(doc["angular_speed"] | 0, -100, 100, -255, 255);
    data[0] = y + x - theta;   // front-right
    data[1] = -y - x + theta;  // front-left
    data[2] = -y + x - theta;  // back-left
    data[3] = y - x -theta;   // back-right
}


void loop()
{


    if (Serial.available())
    {
        input = Serial.readStringUntil('\n');
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, input);
        if (!error)
        {
            updateData(doc);
        }
        else
        {
            Serial.println(input);
        }
    }

    // aplicar último comando recibido (sea de Serial o ESP-NOW)
    move(data[0], data[1], data[2], data[3]);

    // enviar feedback cada 50 ms
    static unsigned long lastSend = 0;
    if (millis() - lastSend >= 1000)
    {
        sendData();
        lastSend = millis();
    }
}