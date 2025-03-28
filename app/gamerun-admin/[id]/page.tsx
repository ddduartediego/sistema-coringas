'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import GameDetailAdmin from './components/GameDetailAdmin';
import AlertaPersonalizado from '../components/AlertaPersonalizado';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';

export default function GameDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClientComponentClient<Database>();
  
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });

  const fecharAlerta = () => {
    setAlerta(prev => ({ ...prev, aberto: false }));
  };

  const exibirAlerta = (mensagem: string, tipo: 'sucesso' | 'erro' | 'info') => {
    setAlerta({
      mensagem,
      tipo,
      aberto: true
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/gamerun-admin" 
            className="mr-4 flex items-center rounded-md bg-white p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            <ArrowBack className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Game</h1>
            <p className="mt-1 text-gray-600">Gerencie as informações e equipes deste game.</p>
          </div>
        </div>
      </div>
      
      <GameDetailAdmin 
        gameId={id} 
        supabase={supabase} 
        exibirAlerta={exibirAlerta}
      />
      
      <AlertaPersonalizado
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        aberto={alerta.aberto}
        onClose={fecharAlerta}
      />
    </div>
  );
} 