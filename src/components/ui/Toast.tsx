import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle size={18} className="text-green-600" />,
  error: <XCircle size={18} className="text-red-600" />,
  warning: <AlertTriangle size={18} className="text-yellow-600" />,
  info: <Info size={18} className="text-blue-600" />,
};

const BG = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full" aria-live="polite">
    <AnimatePresence>
      {toasts.map(toast => (
        <motion.div
          key={toast.id}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${BG[toast.type]}`}
          role="alert"
        >
          <span className="mt-0.5 shrink-0">{ICONS[toast.type]}</span>
          <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);