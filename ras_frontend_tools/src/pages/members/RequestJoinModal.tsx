import { motion } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { API_URL } from "../../utils/config";

interface RequestJoinModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RequestJoinModal({
  onClose,
  onSuccess,
}: RequestJoinModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    major: "",
    doubleMajor: "",
    phoneNumber: "",
    role: "",
    uCode: "",
    skills: [] as string[],
    contributions: [] as string[],
    goals: [] as string[],
    project: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState({ skills: "", contributions: "", goals: "" });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleListInputChange = (field: "skills" | "contributions" | "goals", value: string) => {
    setCurrentInput(prev => ({ ...prev, [field]: value }));
  };

  const addToList = (field: "skills" | "contributions" | "goals") => {
    const value = currentInput[field].trim();
    if (value) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
      setCurrentInput(prev => ({ ...prev, [field]: "" }));
    }
  };

  const removeFromList = (field: "skills" | "contributions" | "goals", index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleListKeyPress = (field: "skills" | "contributions" | "goals", e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addToList(field);
    }
  };

  const handleJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    if (!formData.email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }
    if (!formData.major.trim()) {
      setError("Por favor ingresa tu carrera");
      return;
    }
    if (formData.name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/members/request-join`, formData);
      setFormData({
        name: "",
        email: "",
        major: "",
        doubleMajor: "",
        phoneNumber: "",
        role: "",
        uCode: "",
        skills: [],
        contributions: [],
        goals: [],
        project: "",
      });
      onSuccess?.();
      onClose();
    } catch {
      setError("Error al enviar la solicitud. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <button
          onClick={onClose}
          className="float-right text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="clear-both">
          <h2 className="text-2xl font-bold text-yellow-500 mb-6">
            Solicitar Membresía
          </h2>
          <form onSubmit={handleJoinRequest} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <input
              type="text"
              name="name"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="email"
              name="email"
              placeholder="Tu correo electrónico"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="text"
              name="uCode"
              placeholder="Tu código universitario (opcional)"
              value={formData.uCode}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="text"
              name="major"
              placeholder="Tu carrera"
              value={formData.major}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="text"
              name="doubleMajor"
              placeholder="Doble carrera (opcional)"
              value={formData.doubleMajor}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Tu número de teléfono (opcional)"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="text"
              name="role"
              placeholder="Tu rol (opcional)"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <input
              type="text"
              name="project"
              placeholder="Proyecto (opcional)"
              value={formData.project}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />

            {/* Skills */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Habilidades (presiona Enter)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: React, TypeScript"
                  value={currentInput.skills}
                  onChange={(e) => handleListInputChange("skills", e.target.value)}
                  onKeyPress={(e) => handleListKeyPress("skills", e)}
                  className="flex-1 bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, idx) => (
                  <span key={idx} className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                    {skill}
                    <button type="button" onClick={() => removeFromList("skills", idx)} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Contributions */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Contribuciones (presiona Enter)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Documentación, Testing"
                  value={currentInput.contributions}
                  onChange={(e) => handleListInputChange("contributions", e.target.value)}
                  onKeyPress={(e) => handleListKeyPress("contributions", e)}
                  className="flex-1 bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.contributions.map((contrib, idx) => (
                  <span key={idx} className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                    {contrib}
                    <button type="button" onClick={() => removeFromList("contributions", idx)} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Objetivos (presiona Enter)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Mejorar habilidades, Networking"
                  value={currentInput.goals}
                  onChange={(e) => handleListInputChange("goals", e.target.value)}
                  onKeyPress={(e) => handleListKeyPress("goals", e)}
                  className="flex-1 bg-slate-800 border border-amber-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.goals.map((goal, idx) => (
                  <span key={idx} className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                    {goal}
                    <button type="button" onClick={() => removeFromList("goals", idx)} className="hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}