'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Error as ErrorIcon, 
  Info as InfoIcon,
  Close
} from '@mui/icons-material';

interface AlertaPersonalizadoProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'info';
  aberto: boolean;
  onClose: () => void;
  duracao?: number;
}

export default function AlertaPersonalizado({ 
  mensagem, 
  tipo, 
  aberto, 
  onClose,
  duracao = 5000
}: AlertaPersonalizadoProps) {
  
  useEffect(() => {
    if (aberto && duracao > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duracao);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [aberto, duracao, onClose]);
  
  const cores = {
    sucesso: 'bg-green-50 text-green-700 border-green-200',
    erro: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  
  const icones = {
    sucesso: <CheckCircle className="h-5 w-5 text-green-500" />,
    erro: <ErrorIcon className="h-5 w-5 text-red-500" />,
    info: <InfoIcon className="h-5 w-5 text-blue-500" />,
  };
  
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 right-4 z-50 max-w-md rounded-lg border p-4 shadow-md ${cores[tipo]}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {icones[tipo]}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{mensagem}</p>
            </div>
            <button
              type="button"
              className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-md hover:bg-gray-200 focus:outline-none"
              onClick={onClose}
            >
              <Close className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 