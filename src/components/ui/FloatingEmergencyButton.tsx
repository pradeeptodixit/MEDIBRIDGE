import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const FloatingEmergencyButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/emergency')}
      className="fixed bottom-6 right-4 z-40 flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-full shadow-2xl emergency-pulse"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
      aria-label="Open Emergency Screen"
      id="floating-emergency-btn"
    >
      <AlertTriangle size={18} className="shrink-0" />
      <span className="text-sm font-bold hidden sm:inline">Emergency</span>
    </motion.button>
  );
};
