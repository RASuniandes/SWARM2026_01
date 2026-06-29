import { Instagram, Linkedin, Youtube } from "lucide-react";
import { motion } from "framer-motion";

export default function Root() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Hero Section */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden mb-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <h2 
            className="text-9xl font-black leading-none mb-4" 
            style={{ 
              fontFamily: "'Space Mono', monospace",
              background: 'linear-gradient(135deg, #862633, #FAAE1F)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '4px',
              textShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            RAS UNIANDES
          </h2>
          <motion.p 
            className="text-2xl text-yellow-500 tracking-widest font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ letterSpacing: '3px' }}
          >
            Advancing Technology for Humanity
          </motion.p>
        </motion.div>
      
      </div>
      <hr className="w-screen transform border-t border-yellow-500/30" />
      <section className="flex items-center relative bg-black ">
        <div className="max-w-7xl mx-auto px-12 w-full grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <motion.h1 
              className="text-6xl font-bold mb-4" 
              style={{ fontFamily: "'Space Mono', monospace", background: 'linear-gradient(135deg, #862633, #FAAE1F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              PROYECTO SWARM
            </motion.h1>
            <motion.div 
              className="text-2xl font-semibold text-yellow-500 mb-6" 
              style={{ letterSpacing: '2px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              SYNCHRONIZED WAREHOUSE AUTONOMOUS ROBOTICS MANAGEMENT
            </motion.div>
            <motion.p 
              className="text-lg leading-relaxed text-gray-300 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Plataforma robótica autónoma para gestión logística inteligente. Investigación aplicada en arquitecturas mecánicas, electrónicas y de software basadas en ROS y SLAM, orientadas a la colaboración y navegación multi-robot.
            </motion.p>
            <motion.p 
              className="text-base text-yellow-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              IEEE Robotics and Automation Society | Universidad de Los Andes
            </motion.p>
          </motion.div>
          <motion.div 
            className="flex items-center justify-center h-96 relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img 
              src="/ras_banner.jpg" 
              alt="SWARM Demo" 
              className="w-full h-full object-contain bg-black rounded-2xl shadow-lg" 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <section id="overview" className="py-20">
        <div className="max-w-7xl mx-auto px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-yellow-500 mb-6" style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '2px' }}>
                ABSTRACT
              </h2>
              <p className="text-lg leading-relaxed text-gray-300 mb-4">
                El proyecto SWARM es una <strong>iniciativa de investigación estudiantil</strong> que desarrolla plataformas robóticas autónomas para gestión logística, investigando arquitecturas mecánicas, electrónicas y de software basadas en ROS y SLAM.
              </p>
              <p className="text-lg leading-relaxed text-gray-300 mb-4">
                El desarrollo sigue un enfoque iterativo: <strong>MK1</strong> validó el concepto funcional como prueba de concepto básica. <strong>MK1.5</strong> sirve como versión demo para visualización del producto. <strong>MK2</strong> (en desarrollo) incorpora capacidades reales de elevación (5-10 kg) y transporte de payload (~20 kg).
              </p>
              <p className="text-lg leading-relaxed text-gray-300">
                La <strong>Fase III</strong> marcará la transición hacia especificaciones industriales reales con el <strong>MK3</strong>, diseñado para cargas de 150-200 kg.
              </p>
            </motion.div>
            <motion.div 
              className="bg-gradient-to-br from-red-900/10 to-purple-900/10 border-2 border-red-900 rounded-2xl p-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ borderColor: '#FAAE1F' }}
            >
              <h3 className="text-2xl font-bold text-yellow-500 mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
                ESTADO ACTUAL DEL PROYECTO
              </h3>
              <p className="text-base text-yellow-500 mb-4 leading-relaxed">Proyecto de investigación estudiantil en desarrollo iterativo</p>
              <SpecItem label="MK1 (Completado)" value="Prueba de concepto" />
              <SpecItem label="MK1.5 (En desarrollo)" value="Demo visualización" />
              <SpecItem label="MK2 - Carga elevada" value="5-10 kg" />
              <SpecItem label="MK2 - Payload total" value="~20 kg" />
              <SpecItem label="MK3 (Fase III)" value="Specs industriales" />
              <div className="mt-6 pt-4 border-t border-red-900/30">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="text-yellow-500 font-bold">Meta industrial (MK3):</span> Capacidad de carga 150-200 kg para aplicaciones reales
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Phases Section */}
      <section id="phases" className="py-20" style={{ background: 'linear-gradient(180deg, #0a0a0a, rgba(95, 33, 103, 0.1))' }}>
        <div className="max-w-7xl mx-auto px-12">
          <motion.h2 
            className="text-5xl font-bold text-center text-yellow-500 mb-16" 
            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '3px' }}
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            FASES DE DESARROLLO
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <PhaseCard number="FASE I" title="PLATAFORMA BASE" description="Desarrollo de la plataforma física de robótica. MK1 completado como prueba de concepto. MK2 en desarrollo con chasis reforzado, PCBs optimizadas y arquitectura ROS documentada." />
            <PhaseCard number="FASE II" title="AUTONOMÍA INDIVIDUAL" description="Implementación de algoritmos SLAM, reconocimiento visual con técnicas de seguimiento, evasión de obstáculos e identificación ArUco para lograr autonomía completa." />
            <PhaseCard number="FASE III" title="COLABORACIÓN MULTI-ROBOT" description="Desarrollo de versiones replicables para pruebas de consenso y colaboración entre múltiples unidades. Algoritmos de coordinación y optimización de rutas." />
          </motion.div>
        </div>
      </section>

      {/* Tech Section */}
      <section id="tech" className="py-20">
        <div className="max-w-7xl mx-auto px-12">
          <motion.h2 
            className="text-5xl font-bold text-center text-yellow-500 mb-16" 
            style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '3px' }}
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            STACK TECNOLÓGICO
          </motion.h2>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <TechCategory title="MECÁNICA Y DISEÑO" items={['Fusion 360 para diseño CAD', 'Mecanismo elevador tipo tijera', 'Chasis estructural reforzado', 'Diseño modular y replicable', 'Análisis FEA y simulación']} />
            <TechCategory title="ELECTRÓNICA Y CONTROL" items={['PCBs custom diseñadas en KiCad', 'ESP32 y Arduino para control embebido', 'Protocolos CAN/UART industriales', 'Integración LiDAR y sensores IMU', 'Controladores de motores optimizados']} />
            <TechCategory title="SOFTWARE Y ALGORITMOS" items={['Arquitectura ROS2 para comunicación', 'Python y C++ para desarrollo', 'SLAM para mapeo y localización', 'OpenCV para visión computacional', 'Machine Learning aplicado a rutas']} />
            <TechCategory title="SISTEMAS AVANZADOS" items={['Navegación autónoma multi-robot', 'Algoritmos de consenso distribuido', 'Interfaces humano-robot (HRI)', 'Simulaciones RViz y Gazebo', 'Control de flota en tiempo real']} />
          </motion.div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-20" style={{ background: 'linear-gradient(135deg, #862633, #5F2167)' }}>
        <div className="max-w-7xl mx-auto px-12">
          <motion.div 
            className="bg-black/30 border-2 border-yellow-500/30 rounded-3xl p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ borderColor: '#FAAE1F' }}
          >
            <h3 className="text-3xl font-bold text-center text-yellow-500 mb-12" style={{ fontFamily: "'Space Mono', monospace" }}>
              ROADMAP
            </h3>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <RoadmapItem title="Mk1: Navegación y Colaboración" description="Resolver obstáculos de navegación autónoma mediante simulación y pruebas. Arquitectura fácilmente replicable." />
              <RoadmapItem title="Mk2: Desarrollo Mecánico/Electrónico" description="Mejorar diseño físico, confiabilidad hardware, integración de sensores industriales y optimización energética." />
              <RoadmapItem title="Mk3: Plataforma para Colaboración" description="Desarrollo de plataforma para explorar algoritmos avanzados en RViz, simulaciones multiagente y validación." />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/95 border-t-2 border-red-900 py-8">
        <div className="max-w-7xl mx-auto px-12 text-center">
          <motion.div 
            className="flex justify-center gap-8 mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.a 
              href="https://www.instagram.com/ras_uniandes/?hl=en" 
              target="_blank" 
              rel="noopener" 
              className="text-gray-300 hover:text-yellow-500 transition"
              whileHover={{ scale: 1.2, rotate: 10 }}
            >
              <Instagram className="w-7 h-7" />
            </motion.a>
            <motion.a 
              href="https://www.linkedin.com/company/rasuniandes?originalSubdomain=co" 
              target="_blank" 
              rel="noopener" 
              className="text-gray-300 hover:text-yellow-500 transition"
              whileHover={{ scale: 1.2, rotate: 10 }}
            >
              <Linkedin className="w-7 h-7" />
            </motion.a>
            <motion.a 
              href="https://www.youtube.com/@RasUniandes" 
              target="_blank" 
              rel="noopener" 
              className="text-gray-300 hover:text-yellow-500 transition"
              whileHover={{ scale: 1.2, rotate: 10 }}
            >
              <Youtube className="w-7 h-7" />
            </motion.a>
          </motion.div>
          <p className="text-gray-300">&copy; 2025 RAS Uniandes - Universidad de Los Andes</p>
          <p className="text-yellow-500 font-semibold tracking-wider">IEEE ROBOTICS AND AUTOMATION SOCIETY</p>
          <p className="text-yellow-500 italic mt-4">Advancing Technology for Humanity</p>
        </div>
      </footer>

      <style>{`
        @keyframes gridScroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
      `}</style>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <motion.div 
      className="flex justify-between py-3 border-b border-red-900/30 text-base"
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
    >
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </motion.div>
  );
}

function PhaseCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div 
      className="bg-gradient-to-br from-red-900/10 to-purple-900/10 border-2 border-red-900 rounded-2xl p-8 group"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
      whileHover={{ y: -8, borderColor: '#FAAE1F' }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-5xl font-bold text-red-900/30 mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
        {number}
      </div>
      <h3 className="text-2xl font-bold text-yellow-500 mb-4">{title}</h3>
      <p className="text-base text-gray-300 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TechCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-900/15 to-black/50 border-l-4 border-red-900 p-8 rounded-xl"
      variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } }}
      whileHover={{ borderColor: '#FAAE1F' }}
    >
      <h3 className="text-xl font-bold text-yellow-500 mb-4" style={{ fontFamily: "'Space Mono', monospace" }}>
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <motion.li 
            key={i} 
            className="text-base text-gray-300 hover:text-white transition border-b border-red-900/30 pb-3 last:border-b-0 last:pb-0"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ x: 5 }}
          >
            <span className="text-red-900 font-bold mr-3">▸</span>
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function RoadmapItem({ title, description }: { title: string; description: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
      whileHover={{ x: 5 }}
    >
      <h4 className="text-xl font-semibold text-yellow-500 mb-3">{title}</h4>
      <p className="text-base text-white leading-relaxed">{description}</p>
    </motion.div>
  );
}
