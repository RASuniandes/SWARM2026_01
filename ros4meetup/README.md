# ros4meetup - Paquete ROS2 para Control de Robot SWARM

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Nodos y Funcionalidad](#nodos-y-funcionalidad)
4. [Instalación](#instalación)
5. [Uso](#uso)
6. [Topics y Mensajes](#topics-y-mensajes)
7. [Dependencias](#dependencias)
8. [Solución de Problemas](#solución-de-problemas)

---

## Descripción General

`ros4meetup` es un paquete ROS2 Humble que implementa un sistema de control multi-modal para un robot móvil con 4 ruedas omnidireccionales. El sistema permite cambiar entre diferentes estrategias de control de manera dinámica:

- 👁️ **Visión por computadora**: Seguimiento de personas con MediaPipe
- 🤖 **Navegación autónoma**: Evitación de obstáculos con LiDAR
- 🎮 **Control manual**: Teclado (WASD)
- 📱 **Control remoto**: Desde ESP32 o aplicación móvil
- 🌐 **Interfaz web**: Dashboard de monitoreo y control

### Características

- **Arquitectura modular**: Cada modo de control es un nodo independiente
- **Cambio de modo en caliente**: Sin necesidad de reiniciar el sistema
- **Comunicación serial robusta**: Bridge bidireccional con ESP32
- **Integración con sensores**: LiDAR YDLidar X4 y cámara USB/CSI

---

## Arquitectura del Sistema

```
┌───────────────────────────────────────────────┐
│              CONTROLADORES ROS2               │
│  ┌────────────────────────────────────────┐   │
│  │  vision_controller                     │   │
│  │  autonomous_controller                 │   │
│  │  teleop_controller                     │   │
│  │  (web_controller)                      │   │
│  └─────────────────┬──────────────────────┘   │
│                    │                          │
│                    │ *_command topics         │
│                    │                          │
│                    ↓                          │
│           ┌───────────────────┐               │
│           │   ROUTER          │               │
│           │  (Selector de     │               │
│           │   modo activo)    │               │
│           └────────┬─────────-┘               │
│                    │                          │
│                    │ /cmd_vel                 │
│                    ↓                          │
│           ┌───────────────────┐               │
│           │  SERIAL BRIDGE    │               │
│           │  (ROS ↔ JSON)     │               │
│           └────────┬──────────┘               │
└────────────────────│──────────────────────────┘
                     │ Serial USB (/dev/ttyUSB0)
                     ↓
            ┌────────────────────┐
            │      ESP32         │
            │  (Control de       │
            │   motores)         │
            └────────┬───────────┘
                     │
                     ↓
          ┌────────────────────────┐
          │  4 Motores + Encoders  │
          └────────────────────────┘
```

### Flujo de Datos

1. **Generación de Comandos**: Los controladores leen sensores (cámara, LiDAR, teclado) y publican comandos `Twist` en sus topics específicos
2. **Selección**: El Router suscribe al topic del modo activo y reenvía a `/cmd_vel`
3. **Serialización**: Serial Bridge convierte `Twist` a JSON: `{"linear_speed": X, "angular_speed": Z}`
4. **Transmisión**: Envía el JSON por serial a ESP32
5. **Control de Hardware**: ESP32 calcula PWM para cada motor y cierra el lazo con encoders

---

## Nodos y Funcionalidad

### 1. `router` - Enrutador de Modos

**Archivo**: `src/ros4meetup/router.py`

**Función**: Selecciona dinámicamente qué controlador tiene prioridad.

**Topics**:
- **Suscribe**: `/config` (String) - Cambio de modo
- **Suscribe**: `/{mode}_command` (Twist) - Comandos del modo activo
- **Publica**: `/cmd_vel` (Twist) - Comandos seleccionados

**Modos válidos**: `remote`, `autonomous`, `vision`, `web`, `teleop`

**Ejemplo de uso**:
```bash
# Cambiar a modo autónomo
ros2 topic pub /config std_msgs/String "data: 'autonomous'" --once
```

---

### 2. `serial_bridge` - Puente Serial

**Archivo**: `src/ros4meetup/serial_bridge.py`

**Función**: Traduce mensajes ROS2 ↔ JSON para comunicación con ESP32.

**Características**:
- **Comunicación bidireccional**: Lee y escribe en puerto serial
- **Thread separado** para lectura no bloqueante
- **Puerto**: `/dev/ttyUSB0` a 115200 baudios

**Topics**:
- **Suscribe**: `/cmd_vel` (Twist)
- **Publica**: `/esp_feedback` (String) - Mensajes del ESP32
- **Publica**: `/remote_command` (Twist) - Control remoto desde ESP32

**Formato JSON enviado al ESP32**:
```json
{
  "linear_speed": 100,
  "angular_speed": 50
}
```

**Formato JSON recibido del ESP32**:
```json
{
  "mode": "autonomous",
  "feedback": "Battery: 12.5V",
  "remote_control": {"x": 50, "z": -20}
}
```

---

### 3. `vision_controller` - Seguimiento de Personas

**Archivo**: `src/ros4meetup/vision_controller.py`

**Función**: Sigue a una persona usando detección de pose con MediaPipe.

**Algoritmo**:
1. **Detección**: Identifica hombros o caderas de la persona más cercana
2. **Centrado lateral**: Calcula velocidad angular para centrar la persona
3. **Distancia**: Estima profundidad por tamaño (ratio de ancho de hombros)
4. **Control**:
   - Si está muy cerca (ratio > 0.4): retrocede
   - Si está bien (0.25-0.4): se detiene
   - Si está lejos (< 0.25): avanza

**Topics**:
- **Publica**: `/vision_command` (Twist)

**Parámetros**:
- Velocidad máxima: 100 (normalizada)
- FPS: 10 Hz

---

### 4. `autonomous_controller` - Navegación Autónoma

**Archivo**: `src/ros4meetup/autonomous_controller.py`

**Función**: Navega evitando obstáculos usando datos del LiDAR.

**Algoritmo**:
1. **Lectura**: Procesa datos del LiDAR en 3 zonas (frente, izquierda, derecha)
2. **Detección de obstáculos**: Si la distancia frontal < 0.5m
3. **Decisión**: Gira hacia el lado con más espacio
4. **Ejecución**: Avanza o gira según la situación

**Topics**:
- **Suscribe**: `/laser_scan` (LaserScan)
- **Publica**: `/autonomous_command` (Twist)

**Parámetros**:
- Velocidad lineal: 70
- Velocidad angular: 70
- Distancia mínima: 0.5 metros

---

### 5. `teleop_controller` - Control Manual

**Archivo**: `src/ros4meetup/teleop_controller.py`

**Función**: Control por teclado en tiempo real.

**Teclas**:
- `W`: Avanzar
- `S`: Retroceder
- `A`: Girar izquierda
- `D`: Girar derecha
- `SPACE`: Detener
- `Q`: Salir

**Topics**:
- **Publica**: `/teleop_command` (Twist)

---

### 6. `ojosnodo` - Control de LEDs Faciales

**Archivo**: `src/ros4meetup/ojosnodo.py`

**Función**: Detecta la dirección de movimiento y publica comandos para LEDs "faciales" del robot.

**Lógica**:
- Analiza `/cmd_vel` y determina dirección: `front`, `back`, `left`, `right`, `none`
- Publica en `/faces_direction` para que el ESP32 encienda los LEDs correspondientes

**Topics**:
- **Suscribe**: `/cmd_vel` (Twist)
- **Publica**: `/faces_direction` (String)

---

## Instalación

### Prerrequisitos

```bash
# ROS2 Humble (Ubuntu 22.04)
sudo apt update
sudo apt install ros-humble-desktop python3-colcon-common-extensions

# Dependencias Python
sudo apt install python3-pip
pip3 install pyserial mediapipe opencv-python

# Driver del LiDAR YDLidar
sudo apt install ros-humble-ydlidar-ros2-driver
```

### Compilación

```bash
cd ~/Documents/Ivan/Uniandes/SWARM/ros4meetup/ros4meetup

# Compilar todos los paquetes
colcon build

# Compilar solo ros4meetup
colcon build --packages-select ros4meetup

# Source del workspace
source install/setup.bash
# o, hacer ros.bash, asegurando que sea ejectuable
chmod -x ./ros.bah
./ros.bash
```

### Configuración del Puerto Serial

```bash
# Dar permisos al usuario para acceder a puertos seriales
sudo usermod -aG dialout $USER
# Cerrar sesión y volver a entrar

# Verificar que el ESP32 esté conectado
ls /dev/ttyUSB*
# Debería mostrar: /dev/ttyUSB0 (o similar)

# Si es necesario, modificar el puerto en serial_bridge.py línea 22
```

---

## Uso

### Inicio Completo del Sistema

**Opción 1: Terminales Separadas**

```bash
# Terminal 1: Router
source ~/SWARM/ros4meetup/ros4meetup/install/setup.bash
ros2 run ros4meetup router

# Terminal 2: Serial Bridge
source ~/SWARM/ros4meetup/ros4meetup/install/setup.bash
ros2 run ros4meetup serial_bridge

# Terminal 3: Controlador de Visión (modo por defecto)
source ~/SWARM/ros4meetup/ros4meetup/install/setup.bash
ros2 run ros4meetup vision_controller

# Terminal 4 (opcional): Nodo de LEDs faciales
source ~/SWARM/ros4meetup/ros4meetup/install/setup.bash
ros2 run ros4meetup ojosnodo
```

**Opción 2: Usando tmux o screen**

```bash
# Crear script de inicio
cat > ~/start_swarm.sh << 'EOF'
#!/bin/bash
source ~/SWARM/ros4meetup/ros4meetup/install/setup.bash

tmux new-session -d -s swarm
tmux send-keys -t swarm 'ros2 run ros4meetup router' C-m
tmux split-window -t swarm
tmux send-keys -t swarm 'ros2 run ros4meetup serial_bridge' C-m
tmux split-window -t swarm
tmux send-keys -t swarm 'ros2 run ros4meetup vision_controller' C-m
tmux attach -t swarm
EOF

chmod +x ~/start_swarm.sh
./start_swarm.sh
```

### Cambio de Modo de Control

```bash
# Cambiar a modo autónomo (requiere LiDAR)
ros2 topic pub /config std_msgs/String "data: 'autonomous'" --once
ros2 run ros4meetup autonomous_controller

# Cambiar a control por teclado
ros2 topic pub /config std_msgs/String "data: 'teleop'" --once
ros2 run ros4meetup teleop_controller

# Volver a modo de visión
ros2 topic pub /config std_msgs/String "data: 'vision'" --once
```

### Monitoreo

```bash
# Ver lista de nodos activos
ros2 node list

# Ver topics activos
ros2 topic list

# Monitorear comandos de velocidad
ros2 topic echo /cmd_vel

# Ver información del LiDAR
ros2 topic echo /laser_scan

# Ver feedback del ESP32
ros2 topic echo /esp_feedback

# Visualizar en RViz
ros2 run rviz2 rviz2
# Agregar: LaserScan (/laser_scan), TF, etc.
```

---

## Topics y Mensajes

### Topics Principales

| Topic                | Tipo          | Dirección | Descripción                              |
|----------------------|---------------|-----------|------------------------------------------|
| `/cmd_vel`           | Twist         | ROS → ESP | Comandos de velocidad finales            |
| `/config`            | String        | Usuario   | Selección de modo de control             |
| `/vision_command`    | Twist         | Nodo      | Comandos del controlador de visión      |
| `/autonomous_command`| Twist         | Nodo      | Comandos del controlador autónomo       |
| `/teleop_command`    | Twist         | Nodo      | Comandos del control por teclado         |
| `/remote_command`    | Twist         | ESP → ROS | Comandos remotos desde ESP32             |
| `/laser_scan`        | LaserScan     | LiDAR     | Datos del sensor LiDAR                   |
| `/esp_feedback`      | String        | ESP → ROS | Retroalimentación del microcontrolador   |
| `/faces_direction`   | String        | ROS → ESP | Dirección para LEDs faciales             |

### Estructura del Mensaje Twist

```python
geometry_msgs/Twist:
  linear:
    x: float  # Velocidad lineal (0-100 para este robot)
    y: 0.0    # No usado (robot no holonómico)
    z: 0.0    # No usado
  angular:
    x: 0.0    # No usado
    y: 0.0    # No usado
    z: float  # Velocidad angular (0-100 para este robot)
```

---

## Dependencias

### Paquetes ROS2

```xml
<depend>rclpy</depend>
<depend>std_msgs</depend>
<depend>geometry_msgs</depend>
<depend>sensor_msgs</depend>
<depend>std_srvs</depend>
```

### Bibliotecas Python

```bash
pip3 install pyserial      # Comunicación serial
pip3 install mediapipe     # Detección de pose
pip3 install opencv-python # Procesamiento de imagen
```

### Hardware

- **ESP32**: Microcontrolador principal
- **4 Motores DC**: Con reductora 1:80 y encoders de 12 PPR
- **Drivers L8871**: H-bridge para control de motores
- **YDLidar X4**: Sensor LiDAR de 360°
- **Cámara USB o CSI**: Para visión por computadora

---

## Solución de Problemas

### Error: "Could not open serial port"

```bash
# Verificar permisos
ls -l /dev/ttyUSB0
sudo chmod 666 /dev/ttyUSB0

# Agregar usuario al grupo dialout
sudo usermod -aG dialout $USER
# Cerrar sesión y volver a entrar
```

### Error: "Could not open camera"

```bash
# Verificar dispositivos de cámara
ls /dev/video*

# Probar cámara con OpenCV
python3 -c "import cv2; cap = cv2.VideoCapture(0); print(cap.isOpened())"

# Si no funciona, cambiar índice en vision_controller.py línea 16
# cv2.VideoCapture(1)  # o 2, 3, etc.
```

### Error: "Config service not available"

```bash
# Verificar que el router esté corriendo
ros2 node list | grep router

# Reiniciar el router
ros2 run ros4meetup router
```

### El robot no se mueve

```bash
# 1. Verificar que el ESP32 esté recibiendo datos
ros2 topic echo /cmd_vel

# 2. Verificar serial bridge
ros2 topic echo /esp_feedback

# 3. Revisar logs del serial_bridge
# Debería mostrar: "Sending to ESP32: linear=X, angular=Z"

# 4. Verificar modo activo
ros2 topic pub /config std_msgs/String "data: 'vision'" --once
```

### Bajo rendimiento en visión

```bash
# Reducir resolución de cámara
# En vision_controller.py, después de la línea 16:
# self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
# self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Reducir complejidad del modelo MediaPipe
# En vision_controller.py línea 25:
# model_complexity=0  # en lugar de 1
```

### LiDAR no detecta obstáculos

```bash
# Verificar datos del LiDAR
ros2 topic echo /laser_scan --once

# Visualizar en RViz
ros2 run rviz2 rviz2
# Add > LaserScan > Topic: /laser_scan

# Ajustar distancia mínima en autonomous_controller.py línea 22
# self.min_distance = 0.3  # o valor deseado
```

---

## Estructura de Archivos

```
ros4meetup/
├── ros4meetup/                  # Workspace ROS2
│   ├── src/
│   │   ├── ros4meetup/          # Paquete principal
│   │   │   ├── router.py        # Enrutador de modos
│   │   │   ├── serial_bridge.py # Puente serial ROS-ESP32
│   │   │   ├── vision_controller.py
│   │   │   ├── autonomous_controller.py
│   │   │   ├── teleop_controller.py
│   │   │   ├── ojosnodo.py
│   │   │   └── __init__.py
│   │   ├── setup.py             # Configuración del paquete
│   │   ├── package.xml          # Metadatos y dependencias
│   │   ├── lidar/               # Driver del LiDAR
│   │   └── ...                  # Otros paquetes
│   ├── build/                   # Archivos de compilación
│   ├── install/                 # Instalación del workspace
│   └── log/                     # Logs de compilación
├── firmware/                    # Firmware del ESP32
│   ├── br_motoresesp_RAS.ino   # Código Arduino
│   └── README.md               # Documentación del firmware
└── README.md                    # Este archivo
```

---

## Desarrollo y Extensión

### Añadir un Nuevo Modo de Control

1. **Crear el nodo** en `src/ros4meetup/mi_controlador.py`:

```python
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

class MiControlador(Node):
    def __init__(self):
        super().__init__('mi_controlador')
        self.publisher_ = self.create_publisher(Twist, 'mi_modo_command', 10)
        self.timer = self.create_timer(0.1, self.timer_callback)
    
    def timer_callback(self):
        twist = Twist()
        # ... tu lógica aquí ...
        self.publisher_.publish(twist)

def main(args=None):
    rclpy.init(args=args)
    node = MiControlador()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
```

2. **Registrar en setup.py**:

```python
entry_points={
    'console_scripts': [
        # ... otros entry points ...
        'mi_controlador = ros4meetup.mi_controlador:main',
    ],
},
```

3. **Añadir al router** en `router.py` línea 12:

```python
self.valid_modes = ['remote', 'autonomous', 'vision', 'web', 'teleop', 'mi_modo']
```

4. **Compilar y ejecutar**:

```bash
colcon build --packages-select ros4meetup
source install/setup.bash
ros2 run ros4meetup mi_controlador
ros2 topic pub /config std_msgs/String "data: 'mi_modo'" --once
```

### Modificar el Protocolo Serial

Si necesitas enviar datos adicionales al ESP32:

1. **En serial_bridge.py**, modificar `cmd_vel_callback` (línea 59):

```python
data = {
    'angular_speed': int(msg.angular.z),
    'linear_speed': int(msg.linear.x),
    'timestamp': time.time(),  # Nuevo campo
    'mode': self.current_mode  # Nuevo campo
}
```

2. **En el firmware ESP32**, actualizar el parsing JSON

---

## Recursos Adicionales

- **ROS2 Humble Docs**: https://docs.ros.org/en/humble/
- **MediaPipe Pose**: https://google.github.io/mediapipe/solutions/pose
- **YDLidar ROS2**: https://github.com/YDLIDAR/ydlidar_ros2_driver
- **ESP32 Arduino Core**: https://github.com/espressif/arduino-esp32

---

## Licencia

MIT License
