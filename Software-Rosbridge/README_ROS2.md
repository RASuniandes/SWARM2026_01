# 📑 Documentación de ejecución de ROS2 en Raspberry Pi

A continuación se describen los pasos y comandos necesarios para conectarse a la Raspberry Pi y lanzar los nodos principales de ROS2 utilizados en el proyecto.

---

## 1. Conexión remota vía SSH  
El primer paso es establecer la conexión remota con la Raspberry Pi desde otro equipo (ej. portátil).  
Esto se logra con el comando:  

```bash
ssh raspi@192.168.0.108
```

- `ssh`: protocolo de conexión segura a otro dispositivo.  
- `raspi`: usuario configurado en la Raspberry Pi.  
- `192.168.0.108`: dirección IP de la Raspberry Pi dentro de la red local.  

---

## 2. Acceso al directorio del workspace  
Una vez dentro de la Raspberry Pi, se debe moverse al directorio donde se encuentra el workspace de ROS2.  

```bash
cd swarmROS/src
```

- `cd`: comando para cambiar de directorio.  
- `swarmROS/src`: ruta en donde se encuentran los paquetes ROS2 del proyecto.  

---

## 3. Lanzar el nodo del LIDAR  
El siguiente paso es iniciar el nodo correspondiente al sensor **LD19 LIDAR**.  

```bash
ros2 launch ld19_lidar lidar.launch.py
```

- `ros2 launch`: comando para iniciar un *launch file* de ROS2.  
- `ld19_lidar`: paquete ROS2 que contiene la configuración del LIDAR.  
- `lidar.launch.py`: archivo de lanzamiento que inicia los nodos necesarios para operar el sensor.  

---

## 4. Lanzar el servidor Rosbridge  
Finalmente, se levanta el servidor **Rosbridge**, el cual permite la comunicación entre ROS2 y aplicaciones externas (ej. aplicaciones web vía WebSocket).  

```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

- `ros2 launch`: inicia un *launch file*.  
- `rosbridge_server`: paquete encargado de abrir el servidor de comunicación.  
- `rosbridge_websocket_launch.xml`: archivo de configuración que habilita el acceso a través de WebSockets.  

---

✅ Con estos pasos, la Raspberry Pi queda lista para:  
- Recibir datos del LIDAR.  
- Exponerlos mediante **Rosbridge** para que otros clientes puedan conectarse (por ejemplo, una interfaz web o aplicaciones de monitoreo).  
