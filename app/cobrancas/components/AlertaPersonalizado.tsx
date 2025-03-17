'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Error, Close, Info } from '@mui/icons-material';

interface AlertaPersonalizadoProps {
  mensagem: string;
  tipo?: 'sucesso' | 'erro' | 'info';
  duracao?: number;
  onClose: () => void;
  open: boolean;
}

export default function AlertaPersonalizado({
  mensagem,
  tipo = 'sucesso',
  duracao = 3000,
  onClose,
  open
}: AlertaPersonalizadoProps) {
  useEffect(() => {
    if (open && duracao > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duracao);
      
      return () => clearTimeout(timer);
    }
  }, [open, duracao, onClose]);
  
  if (!open) return null;
  
  const getIcon = () => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle className="text-green-600" />;
      case 'erro':
        return <Error className="text-red-600" />;
      case 'info':
        return <Info className="text-blue-600" />;
      default:
        return <CheckCircle className="text-green-600" />;
    }
  };
  
  const getBgColor = () => {
    switch (tipo) {
      case 'sucesso':
        return 'bg-green-50';
      case 'erro':
        return 'bg-red-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-green-50';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      />
      
      <div className={`relative ${getBgColor()} rounded-lg max-w-md w-full p-6 shadow-xl`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {mensagem}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <Close fontSize="small" />
          </button>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
} 