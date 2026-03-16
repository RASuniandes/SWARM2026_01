import { motion } from "framer-motion";
import { Mail, Phone, Calendar, Award, Code } from "lucide-react";
import type { MemberCardProps } from "./memberType";

const importantRoleMappers: Record<string, string> = {
  "Presidente": "border-amber-500/40 bg-amber-500/10 text-amber-400",
  "Vicepresidente": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "Secretario": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "Tesorero": "border-amber-500/30 bg-amber-500/10 text-amber-400",
  "Electronic Lead": "border-blue-500/30 bg-blue-500/10 text-blue-400",
  "Mechanical Lead": "border-green-500/30 bg-green-500/10 text-green-400",
  "Software Lead": "border-purple-500/30 bg-purple-500/10 text-purple-400",
};

export default function MemberCard({ member }: MemberCardProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="relative rounded-2xl p-[1px] bg-gradient-to-br from-amber-500/40 via-transparent to-amber-600/40 group"
    >
      <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-7 overflow-hidden transition-all duration-300 group-hover:border-amber-500/40">

        {/* subtle glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
        </div>

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-40 group-hover:opacity-80 transition" />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between mb-6">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-amber-500/30 group-hover:ring-amber-400 transition"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center ring-2 ring-amber-500/30">
                <span className="text-xl font-bold text-black">
                  {member.name.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white tracking-tight">
                {member.name}
              </h3>
              <p className="text-sm text-zinc-400">{member.major}</p>
              {member.doubleMajor && (
                <p className="text-sm text-zinc-500">
                  {member.doubleMajor}
                </p>
              )}
            </div>
          </div>

          
        </div>
              {member.role && importantRoleMappers[member.role] && (
            <div className={`bg-amber-500/10 mb-4 border border-amber-500/40 flex justify-center px-3 py-1 rounded-full backdrop-blur-md ${importantRoleMappers[member.role] || ''}`}>
              <span className="text-xs text-center font-semibold tracking-wider text-amber-400">
                {member.role.toUpperCase()}
              </span>
            </div>
          )}
        {/* Contact Info */}
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex items-center gap-2 text-zinc-300">
            <Mail className="w-4 h-4 text-amber-500" />
            <a
              href={`mailto:${member.email}`}
              className="text-zinc-400 hover:text-amber-400 transition truncate"
            >
              {member.email}
            </a>
          </div>

          {member.phoneNumber && (
            <div className="flex items-center gap-2 text-zinc-300">
              <Phone className="w-4 h-4 text-amber-500" />
              <span className="text-zinc-400">
                {member.phoneNumber}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-zinc-300">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-zinc-400">
              {new Date(member.joinDate).toLocaleDateString("es-ES")}
            </span>
          </div>
        </div>

        {/* Project + Code */}
        {(member.project || member.uCode) && (
          <div className="mb-6 pt-4 border-t border-zinc-800 space-y-2">
            {member.project && (
              <p className="text-sm text-zinc-300">
                <span className="text-amber-400 font-semibold">
                  Proyecto:
                </span>{" "}
                {member.project}
              </p>
            )}

            {member.uCode && (
              <p className="text-sm text-zinc-300">
                <span className="text-amber-400 font-semibold">
                  Código:
                </span>{" "}
                {member.uCode}
              </p>
            )}
          </div>
        )}

        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-zinc-300">
                Habilidades
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 group-hover:border-amber-500/30 transition"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contributions */}
        {member.contributions && member.contributions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-zinc-300">
                Contribuciones
              </span>
            </div>

            <ul className="space-y-2">
              {member.contributions.map((contrib, idx) => (
                <li
                  key={idx}
                  className="text-zinc-400 text-xs flex items-start gap-2"
                >
                  <span className="text-amber-500">•</span>
                  <span className="line-clamp-1">{contrib}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}