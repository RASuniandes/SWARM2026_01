import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode = 404,
  title = "Página No Encontrada",
  description = "La página que estás buscando no existe o ha sido movida.",
  showBackButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #0d1a36 100%)",
        }}
      />

      {/* Animated Background Elements */}
      <motion.div
        className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Error Code */}
        <motion.div
          className="mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {statusCode}
          </h1>
        </motion.div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-lg mb-8 md:mb-12">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {showBackButton && (
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              Volver
            </motion.button>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-colors"
            >
              <Home size={20} className="text-white" />
              <span className="text-white">Home</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;