# SWARM - Sistema de Control para Robot Móvil

## Descripción General

Este repositorio contiene el sistema completo de control para un robot móvil de 4 ruedas omnidireccionales, desarrollado en la Universidad de los Andes. El proyecto integra:

- **Hardware**: ESP32 con 4 motores DC con encoders y drivers L8871
- **Software**: ROS 2 (Robot Operating System) con múltiples modos de control
- **Sensores**: LiDAR YDLidar para navegación autónoma
- **Visión**: MediaPipe para seguimiento de personas

## Estructura del Proyecto

```
SWARM/
├── ros4meetup/              # Paquete principal ROS2
│   ├── ros4meetup/          # Workspace de ROS2
│   │   ├── src/             # Código fuente
│   │   │   ├── ros4meetup/  # Nodos de control
│   │   │   ├── lidar/       # Driver del LiDAR
│   │   │   └── ...          # Otros paquetes
│   │   └── ...              # Build, install, log
│   └── README.md            # Documentación detallada de ROS2
├── CódigoControl/           # Firmware para ESP32 (Arduino)
├── Control SWARM/           # Diseños de PCB (KiCad)
├── Electrónica/             # Esquemáticos y documentación electrónica
├── Dashboard preliminar/    # Interfaz web de monitoreo
└── ojos_frontales/          # Codigo ESP32 para ojos (Matriz 64x2)
```

## Características Principales

### Modos de Control

1. **Vision** (por defecto): Seguimiento de personas usando MediaPipe
2. **Autonomous**: Navegación autónoma con evitación de obstáculos (LiDAR)
3. **Teleop**: Control manual por teclado (W/A/S/D)
4. **Remote**: Control remoto desde ESP32
5. **Web**: Control desde interfaz web

### Arquitectura

```
[Controladores]  →  [Router]  →  [Serial Bridge]  →  [ESP32]  →  [Motores]
                      ↓ cmd_vel
                  [Comandos de velocidad]
```

Cada controlador publica en su propio topic (`vision_command`, `autonomous_command`, etc.). El **Router** selecciona qué controlador está activo y reenvía sus comandos a `cmd_vel`. El **Serial Bridge** convierte estos comandos a JSON y los envía al ESP32 por puerto serial.

## Inicio Rápido

### Requisitos

- Ubuntu 22.04 o superior
- ROS 2 Humble
- Python 3.10+
- Arduino IDE (para firmware ESP32)

### Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/RASuniandes/SWARM.git
cd SWARM/ros4meetup
```

2. **Configurar el entorno ROS2:**
```bash
source ros4meetup/ros.bash
```

3. **Compilar el workspace:**
```bash
cd ros4meetup
colcon build
source install/setup.bash
```

4. **Cargar firmware en ESP32:**
   - Ver documentación en `ros4meetup/firmware/README.md`

### Ejecución

1. **Iniciar el sistema básico:**
```bash
# Terminal 1: Router
ros2 run ros4meetup router

# Terminal 2: Serial Bridge
ros2 run ros4meetup serial_bridge

# Terminal 3: Controlador (elige uno)
ros2 run ros4meetup vision_controller
# o
ros2 run ros4meetup autonomous_controller
# o
ros2 run ros4meetup teleop_controller
```

2. **Cambiar de modo:**
```bash
ros2 topic pub /config std_msgs/String "data: 'autonomous'" --once
```

## Documentación Adicional

- **ROS2 y Nodos**: Ver `ros4meetup/README.md`
- **Firmware ESP32**: Ver `ros4meetup/firmware/README.md`
- **Electrónica**: Ver `Electrónica/`
- **PCB**: Ver `Control SWARM/`

## Desarrollo

### Estructura de Topics ROS2

- `/cmd_vel` (Twist): Comandos de velocidad final al robot
- `/config` (String): Cambio de modo de control
- `/vision_command` (Twist): Comandos del controlador de visión
- `/autonomous_command` (Twist): Comandos del controlador autónomo
- `/teleop_command` (Twist): Comandos del control por teclado
- `/remote_command` (Twist): Comandos remotos desde ESP32
- `/laser_scan` (LaserScan): Datos del LiDAR
- `/esp_feedback` (String): Retroalimentación del ESP32
- `/faces_direction` (String): Dirección para LEDs faciales

### Hardware

- **Microcontrolador**: ESP32
- **Motores**: 4x DC con reductora 1:80 y encoders (12 PPR)
- **Drivers**: L8871 (H-bridge)
- **Sensor**: YDLidar X4
- **Cámara**: USB o CSI para visión

## Licencia

MIT
