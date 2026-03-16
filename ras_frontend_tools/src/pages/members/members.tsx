import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Lock, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import type { Member } from './memberType';
import MemberCard from './MemberCard';
import RequestJoinModal from './RequestJoinModal';


const frontendMembers: Member[] = [
  {
    id: '1',
    name: 'Felipe Gutiérrez',
    role: 'Presidente',
    contributions: ['Liderar el equipo', 'Organizar eventos', 'Gestionar proyectos'],
    project: 'RAS Uniandes',
    uCode: 'fegutierrez',
    email: 'fegutierrez@uniandes.edu.co',
    joinDate: '2023-01-01',
    major: 'Ingeniería Electrónica',
    doubleMajor: 'Ingeniería de Sistemas',
    isInCouncil: true,
    skills: ['Modelado 3D', 'Programación en Python', 'Gestión de Proyectos'],
    photo: '/felipe_gutierrez.jpg',
    phoneNumber: '3022473968',
  }
]
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(frontendMembers || []);
  const [loading, setLoading] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinEmail, setJoinEmail] = useState('');
  const [joinName, setJoinName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/members`);
      if (response.status !== 200) throw new Error('Error al cargar miembros');
      const data = response.data;
      setMembers(data || frontendMembers); // Usar datos de frontend si backend falla
    } catch {
      setError('No se pudieron cargar los miembros');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_URL}/api/members/add`, {
        password: adminPassword
      });

      if (response.status !== 200) throw new Error('Contraseña incorrecta');
      setSuccess('Acceso autorizado. Nuevo miembro agregado.');
      setAdminPassword('');
      setShowPasswordModal(false);
      fetchMembers();
    } catch {
      setError('Error al autorizar: Contraseña incorrecta');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      {/* Header Section */}
      <section className="min-h-[40vh] flex items-center pt-20 relative">
        <div className="max-w-7xl mx-auto px-12 w-full">
          <motion.h1
            className="text-6xl font-bold mb-4"
            style={{
              fontFamily: "'Space Mono', monospace",
              background: 'linear-gradient(135deg, #862633, #FAAE1F)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            EQUIPO SWARM
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Investigadores y desarrolladores dedicados a la robótica autónoma
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition flex items-center gap-2 text-white"
            >
              <Plus className="w-5 h-5 text-white" />
              Solicitar Membresía
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-6 py-3 bg-red-900/50 border-2 border-red-900 text-white rounded-lg font-semibold hover:border-yellow-500 transition flex items-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Agregar Miembro
            </button>
          </motion.div>
        </div>
      </section>

      {/* Members Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-12">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-lg mb-6">
              {success}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-300">Cargando miembros...</div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {members.length > 0 && members.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Password Modal */}
      {showPasswordModal && (
        <Modal onClose={() => setShowPasswordModal(false)}>
          <h2 className="text-2xl font-bold text-yellow-500 mb-6">Autorización de Admin</h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña de administrador"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition text-white"
            >
              Autorizar
            </button>
          </form>
        </Modal>
      )}

      {/* Join Request Modal */}
      {showJoinModal && (
        <RequestJoinModal onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <button
          onClick={onClose}
          className="float-right text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5 rotate-180" />
        </button>
        <div className="clear-both">{children}</div>
      </motion.div>
    </motion.div>
  );
}