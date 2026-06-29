# Firmware ESP32 - Control de Motores para Robot SWARM

## Descripción General

Este firmware está diseñado para ejecutarse en un **ESP32** y controlar 4 motores DC con encoders mediante drivers L8871 (H-bridge). El código implementa:

- **Comunicación serial bidireccional** (JSON) con ROS2
- **Control PWM** de 4 motores independientes
- **Lectura de encoders** mediante interrupciones
- **Cálculo de RPM en tiempo real**
- **Clase modular** para manejo de motores

---

## Índice

1. [Hardware](#hardware)
2. [Configuración de Pines](#configuración-de-pines)
3. [Arquitectura del Código](#arquitectura-del-código)
4. [Protocolo de Comunicación](#protocolo-de-comunicación)
5. [Instalación](#instalación)
6. [Uso](#uso)
7. [Explicación Detallada del Código](#explicación-detallada-del-código)
8. [Solución de Problemas](#solución-de-problemas)

---

## Hardware

### Componentes Principales

- **Microcontrolador**: ESP32 DevKit v1 (o compatible)
- **Motores**: 4x motores DC con reductora 1:80
- **Encoders**: Encoders cuadráticos de 12 PPR (pulsos por revolución)
- **Drivers**: 4x L8871 (H-bridge, control bidireccional)
- **Alimentación**: 
  - ESP32: 5V via USB o regulador
  - Motores: 12V (batería o fuente externa)

### Especificaciones de los Motores

- **Voltaje nominal**: 12V DC
- **Relación de reducción**: 1:80
- **Encoders**: 12 PPR en el eje del motor
- **PPR efectivo después de reductora**: 12 × 80 = 960 PPR en el eje de salida

---

## Configuración de Pines

### Tabla de Conexiones

| Motor | IN1 (PWM) | IN2 (PWM) | Canal PWM 1 | Canal PWM 2 | Encoder A | Encoder B |
|-------|-----------|-----------|-------------|-------------|-----------|-----------|
| **Motor 1** | GPIO 1  | GPIO 2  | CH0 | CH1 | GPIO 4  | GPIO 5  |
| **Motor 2** | GPIO 6  | GPIO 7  | CH2 | CH3 | GPIO 17 | GPIO 18 |
| **Motor 3** | GPIO 8  | GPIO 3  | CH4 | CH5 | GPIO 9  | GPIO 10 |
| **Motor 4** | GPIO 11 | GPIO 12 | CH6 | CH7 | GPIO 13 | GPIO 14 |

### Pines I2C (No usados actualmente)

- **SDA**: GPIO 15
- **SCL**: GPIO 16

*Nota: Estos pines están definidos pero no se usan en esta versión del código*

---

## Arquitectura del Código

### Estructura General

```
┌─────────────────────────────────────────┐
│         setup() - Inicialización       │
│  - Serial 115200 baudios               │
│  - Inicialización de 4 motores         │
│  - Configuración de interrupciones     │
└─────────────┬───────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────┐
│          loop() - Ciclo principal       │
│  ┌───────────────────────────────────┐  │
│  │ 1. Leer JSON desde serial        │  │
│  │    {"linear_speed": X,           │  │
│  │     "angular_speed": Z}          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 2. Actualizar RPM de encoders    │  │
│  │    (cada 500ms)                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 3. Controlar motores             │  │
│  │    (forward/backward/stop)       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 4. Publicar RPM por serial       │  │
│  │    (cada 1000ms)                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Clase `Motor`

Cada motor se encapsula en una clase que gestiona:

- **Control PWM**: Avanzar, retroceder, detener
- **Lectura de encoders**: Mediante interrupciones (ISR)
- **Cálculo de RPM**: Basado en pulsos contados
- **Estado interno**: Pulsos acumulados, última lectura, tiempo

---

## Protocolo de Comunicación

### Formato de Mensajes

La comunicación con ROS2 (vía `serial_bridge`) usa **JSON** con terminador de línea `\n`.

#### 1. Comandos ROS2 → ESP32

```json
{
  "linear_speed": 100,
  "angular_speed": 50
}
```

**Campos**:
- `linear_speed` (int): Velocidad lineal del robot (-100 a 100)
  - Positivo: avanzar
  - Negativo: retroceder
  - 0: detenido
- `angular_speed` (int): Velocidad de rotación (-100 a 100)
  - Positivo: girar a la derecha
  - Negativo: girar a la izquierda
  - 0: sin rotación

#### 2. Retroalimentación ESP32 → ROS2

```json
{
  "rpm1": 45.2,
  "rpm2": 44.8,
  "rpm3": 45.5,
  "rpm4": 44.9,
  "battery": 12.3,
  "mode": "autonomous"
}
```

**Campos opcionales**:
- `rpm1`, `rpm2`, `rpm3`, `rpm4`: RPM de cada motor
- `battery`: Voltaje de batería (si se implementa)
- `mode`: Solicitud de cambio de modo
- `feedback`: Mensajes de estado
- `remote_control`: Comandos desde control remoto

---

## Instalación

### Requisitos

1. **Arduino IDE** (versión 2.x recomendada) o **PlatformIO**
2. **Soporte para ESP32**:
   - En Arduino IDE: 
     - `Archivo → Preferencias → URLs adicionales de gestor de tarjetas`
     - Agregar: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
     - `Herramientas → Placa → Gestor de tarjetas → ESP32 → Instalar`

3. **Biblioteca ArduinoJson**:
   - `Herramientas → Administrar bibliotecas`
   - Buscar "ArduinoJson" por Benoit Blanchon
   - Instalar versión 6.x

### Pasos de Instalación

```bash
# 1. Clonar el repositorio (si aún no lo has hecho)
git clone https://github.com/RASUniandes/SWARM

# 2. Abrir el firmware
# En Arduino IDE: Archivo → Abrir → ros4meetup/firmware/br_motoresesp_RAS.ino
```

### Configuración en Arduino IDE

1. **Seleccionar placa**: `Herramientas → Placa → ESP32 Arduino → ESP32 Dev Module`
2. **Puerto**: `Herramientas → Puerto → /dev/ttyUSB0` (Linux) o `COM#` (Windows)
3. **Configuración avanzada**:
   - Upload Speed: 921600
   - Flash Frequency: 80MHz
   - Flash Mode: QIO
   - Partition Scheme: Default 4MB with spiffs

### Cargar el Firmware

1. **Verificar**: `Sketch → Verificar/Compilar` (Ctrl+R)
2. **Cargar**: `Sketch → Subir` (Ctrl+U)
3. **Monitor Serial**: `Herramientas → Monitor Serie` (115200 baudios)

---

## Uso

### Prueba Básica sin ROS2

```bash
# Abrir monitor serial (115200 baudios)
# Enviar comandos JSON manualmente:

{"linear_speed": 100, "angular_speed": 0}   # Avanzar
{"linear_speed": -50, "angular_speed": 0}   # Retroceder
{"linear_speed": 0, "angular_speed": 100}   # Girar derecha
{"linear_speed": 0, "angular_speed": 0}     # Detener
```

### Integración con ROS2

Una vez cargado el firmware, el ESP32 se comunica automáticamente con el nodo `serial_bridge` de ROS2.

```bash
# En tu sistema ROS2
ros2 run ros4meetup serial_bridge

# En otra terminal, enviar comandos
ros2 topic pub /cmd_vel geometry_msgs/Twist \
  "{linear: {x: 50.0}, angular: {z: 0.0}}" --once
```

### Monitoreo de RPM

```bash
# Ver feedback del ESP32 en ROS2
ros2 topic echo /esp_feedback
```

---

## Explicación Detallada del Código

### Sección 1: Definición de Pines (Líneas 43-66)

```cpp
#define M1_IN1 1
#define M1_IN2 2
#define ENC1_A 4
#define ENC1_B 5
// ... (similar para M2, M3, M4)
```

**¿Qué hace?**
- Define los pines GPIO del ESP32 para cada motor y encoder
- `M#_IN1/IN2`: Pines de control del H-bridge (dirección + velocidad)
- `ENC#_A/B`: Señales cuadráticas del encoder (fase A y B)

---

### Sección 2: Clase Motor (Líneas 69-173)

#### Constructor (Líneas 83-95)

```cpp
Motor(int _in1, int _in2, int _ch1, int _ch2, int _encA, int _encB)
```

**Parámetros**:
- `_in1`, `_in2`: Pines GPIO de control
- `_ch1`, `_ch2`: Canales PWM del ESP32 (0-15 disponibles)
- `_encA`, `_encB`: Pines GPIO del encoder

**Inicializa**:
- Contadores de pulsos a 0
- Configuración de tiempo para cálculo de RPM

---

#### Método `init()` (Líneas 97-110)

**Funciones**:

1. **Configuración de PWM**:
```cpp
ledcSetup(ch1, 1000, 8);  // Canal, Frecuencia (1kHz), Resolución (8 bits)
ledcAttachPin(in1, ch1);   // Asociar GPIO al canal PWM
```
- Frecuencia: 1000 Hz (período de 1ms)
- Resolución: 8 bits → valores de 0 a 255

2. **Configuración de encoders**:
```cpp
pinMode(encA, INPUT_PULLUP);  // Resistencia pull-up interna
attachInterruptArg(digitalPinToInterrupt(encA), isrA, this, CHANGE);
```
- `INPUT_PULLUP`: Activa resistencia pull-up (señal estable)
- `attachInterruptArg`: Asocia ISR al cambio de estado del pin
- `this`: Pasa el objeto Motor a la ISR

---

#### Métodos de Control (Líneas 112-128)

**1. `forward(int speed)`**: Avanzar
```cpp
ledcWrite(ch1, speed);  // IN1 = PWM
ledcWrite(ch2, 0);      // IN2 = 0
```
- Corriente fluye de IN1 a IN2 → motor gira en un sentido

**2. `backward(int speed)`**: Retroceder
```cpp
ledcWrite(ch1, 0);      // IN1 = 0
ledcWrite(ch2, speed);  // IN2 = PWM
```
- Corriente fluye de IN2 a IN1 → motor gira en sentido opuesto

**3. `stop()`**: Detener
```cpp
ledcWrite(ch1, 0);
ledcWrite(ch2, 0);
```
- Sin corriente → freno eléctrico

---

#### Cálculo de RPM (Líneas 130-141)

```cpp
void updateRPM() {
    unsigned long now = millis();
    if (now - lastTime >= 500) {  // Cada 500ms
        long delta = pulsos - lastPulsos;  // Pulsos nuevos
        float tiempoSeg = (now - lastTime) / 1000.0;
        
        rpm = (delta / (float)pulsosPorVuelta) * (60.0 / tiempoSeg) / reduccion;
        //     └─────────────────────┬────────────────────┘   └──┬───┘
        //                      Vueltas/seg                 Ajuste reductora
        
        lastPulsos = pulsos;
        lastTime = now;
    }
}
```

**Fórmula explicada**:

1. **Pulsos a vueltas**: `delta / pulsosPorVuelta`
   - Ejemplo: 24 pulsos / 12 PPR = 2 vueltas del motor

2. **Vueltas por segundo**: `vueltas / tiempoSeg`
   - Ejemplo: 2 vueltas / 0.5 seg = 4 vueltas/seg

3. **RPM**: `vueltas/seg × 60`
   - Ejemplo: 4 vueltas/seg × 60 = 240 RPM (motor)

4. **RPM del eje de salida**: `RPM_motor / reduccion`
   - Ejemplo: 240 RPM / 80 = 3 RPM (eje final)

---

#### Encoders e Interrupciones (Líneas 153-172)

```cpp
void encoderChange(bool a, bool b) {
    if (a == b)
        pulsos++;  // Giro horario
    else
        pulsos--;  // Giro antihorario
}
```

**Principio del encoder cuadrático**:

```
Giro horario (→):
  A: ──┐   ┌───┐   ┌──
      └───┘   └───┘
  B: ────┐   ┌───┐   ┌
         └───┘   └───┘
         ↑ A==B → incrementar

Giro antihorario (←):
  A: ──┐   ┌───┐   ┌──
      └───┘   └───┘
  B: ┌───┐   ┌───┐
     └───┘   └───┘
     ↑ A≠B → decrementar
```

**ISR (Interrupt Service Routine)**:
```cpp
static void isrA(void *arg) {
    Motor *m = static_cast<Motor *>(arg);  // Recuperar objeto
    m->encoderChange(digitalRead(m->encA), digitalRead(m->encB));
}
```
- `static`: Necesario para que funcione como callback de interrupción
- `void *arg`: Puntero al objeto Motor
- Se ejecuta en cada flanco (CHANGE) del encoder

---

### Sección 3: Setup (Líneas 182-190)

```cpp
void setup() {
    Serial.begin(115200);
    motor1.init();
    motor2.init();
    motor3.init();
    motor4.init();
    Serial.println("Motores con encoder inicializados.");
}
```

**Proceso**:
1. Inicia comunicación serial a 115200 baudios
2. Inicializa cada motor (PWM + interrupciones)
3. Imprime confirmación

---

### Sección 4: Loop Principal (Líneas 210-236)

#### 1. Actualización de RPM

```cpp
motor1.updateRPM();
motor2.updateRPM();
motor3.updateRPM();
motor4.updateRPM();
```
- Se ejecuta en cada iteración
- Pero solo calcula RPM cada 500ms (internamente)

#### 2. Impresión de RPM

```cpp
if (millis() - lastPrint > 1000) {
    Serial.print("RPM1: "); Serial.print(motor1.getRPM());
    // ... (similar para otros motores)
    lastPrint = millis();
}
```
- Imprime RPM en monitor serial cada 1 segundo

#### 3. Ejemplo de Movimiento

```cpp
moverAdelante(200);  // Velocidad 200/255 (~78% del máximo)
delay(2000);         // Durante 2 segundos
detenerTodo();
delay(1000);
```

**Nota**: Este código de prueba debe reemplazarse por la lógica de lectura JSON para integración con ROS2.

---

### Sección 5: Integración JSON (Líneas 1-41)

Esta sección muestra cómo parsear comandos JSON:

```cpp
if (Serial.available()) {
    input = Serial.readStringUntil('\n');  // Leer hasta \n
    
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, input);
    
    if (!error) {
        int motor = doc["motor"];                 // Extraer campos
        const char *direccion = doc["direccion"];
        
        // Usar valores para controlar motores
    }
}
```

**Para integración completa**, deberías:

1. **Eliminar el código de prueba** (líneas 232-235)
2. **Agregar lógica de cinemática** para convertir `linear_speed` y `angular_speed` a velocidades individuales de cada motor
3. **Enviar feedback** en formato JSON

---

## Solución de Problemas

### El ESP32 no se conecta

```bash
# Verificar puerto
ls /dev/ttyUSB*

# Dar permisos
sudo chmod 666 /dev/ttyUSB0

# En Arduino IDE
# Herramientas → Puerto → Seleccionar el correcto
```

### Error al compilar

```
'ledcSetup' was not declared in this scope
```

**Solución**: Asegurarse de tener instalada la versión correcta del paquete ESP32 (2.0.x o superior).

### Los motores no se mueven

1. **Verificar alimentación**: Los motores necesitan 12V, el ESP32 solo 5V
2. **Revisar conexiones**: Verificar soldaduras y cables
3. **Medir con multímetro**: Comprobar voltaje en pines IN1/IN2 al enviar comandos
4. **Revisar drivers**: Los L8871 deben estar correctamente conectados y alimentados

### Encoders no cuentan pulsos

```cpp
// Añadir debug en ISR (solo temporalmente, las ISR deben ser rápidas)
void encoderChange(bool a, bool b) {
    pulsos += (a == b) ? 1 : -1;
    // Serial.println(pulsos);  // ¡SOLO PARA DEBUG! Quitar después
}
```

**Verificaciones**:
- Pull-ups activados: `pinMode(encA, INPUT_PULLUP)`
- Encoder alimentado (si lo requiere)
- Cables no intercambiados

### RPM siempre 0

1. **Motor no gira**: Revisar apartado anterior
2. **`updateRPM()` no se llama**: Verificar en loop()
3. **Constantes incorrectas**: 
   - `pulsosPorVuelta = 12` (para encoder de 12 PPR)
   - `reduccion = 80.0` (ajustar según tu motor)

### JSON no se parsea

```bash
# Probar en monitor serial
{"linear_speed": 100, "angular_speed": 0}

# Verificar terminador: debe ser \n (nueva línea)
# En Arduino IDE: Config. monitor → "Nueva Línea"
```

---

## Próximos Pasos

### Mejoras Sugeridas

1. **Control PID**: Implementar lazo cerrado para mantener velocidad constante
2. **Cinemática inversa**: Calcular velocidades individuales de ruedas según `linear_speed` y `angular_speed`
3. **Odometría**: Calcular posición del robot basada en encoders
4. **Limitación de corriente**: Proteger motores y drivers
5. **Watchdog**: Detener motores si no recibe comandos por X tiempo

### Ejemplo de Cinemática (4 ruedas omnidireccionales)

```cpp
// Configuración en X
void calcularVelocidadesMotores(float vx, float vy, float omega) {
    float v1 = vx - vy - omega * L;
    float v2 = vx + vy - omega * L;
    float v3 = vx + vy + omega * L;
    float v4 = vx - vy + omega * L;
    
    // Escalar y aplicar a motores
    motor1.forward(abs(v1)); // Agregar lógica de dirección
    // ...
}
```

---

## Recursos

- **ESP32 PWM**: https://randomnerdtutorials.com/esp32-pwm-arduino-ide/
- **ArduinoJson**: https://arduinojson.org/v6/doc/
- **Encoders cuadráticos**: https://howtomechatronics.com/tutorials/arduino/rotary-encoder-works-use-arduino/
- **Control de motores**: https://www.electronicwings.com/esp32/dc-motor-interfacing-with-esp32

---

## Licencia

MIT License