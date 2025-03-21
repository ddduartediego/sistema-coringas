'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SportsEsports, CalendarMonth, Person, PlayArrow } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AlertaPersonalizado from './AlertaPersonalizado';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import SafeImage from '@/components/ui/safe-image';

interface GameCardProps {
  id: string;
  titulo: string;
  descricao_curta: string;
  data_inicio: string | null;
  quantidade_integrantes: number;
  imagem_url: string | null;
  status: string;
  onOpenModal: (gameId: string) => void;
  supabase: SupabaseClient<Database>;
  onGameUpdated: () => void;
}

export default function GameCard({
  id,
  titulo,
  descricao_curta,
  data_inicio,
  quantidade_integrantes,
  imagem_url,
  status,
  onOpenModal,
  supabase,
  onGameUpdated
}: GameCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });

  // Calcular tempo restante
  useEffect(() => {
    const calcularTempoRestante = () => {
      if (!data_inicio) {
        setTimeLeft('Data não definida');
        return;
      }

      const agora = new Date();
      const dataInicio = new Date(data_inicio);
      
      if (agora > dataInicio) {
        setTimeLeft('Game em andamento');
        return;
      }
      
      try {
        const distancia = formatDistanceToNow(dataInicio, { 
          locale: ptBR, 
          addSuffix: true 
        });
        setTimeLeft(distancia);
      } catch (error) {
        console.error('Erro ao formatar data:', error);
        setTimeLeft('Data inválida');
      }
    };
    
    calcularTempoRestante();
    
    // Atualizar a cada minuto
    const interval = setInterval(calcularTempoRestante, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, [data_inicio]);
  
  // Ativar game
  const ativarGame = async () => {
    try {
      // Verificar se os campos necessários estão preenchidos
      if (!data_inicio) {
        setAlerta({
          mensagem: 'Não é possível ativar um game sem data de início.',
          tipo: 'erro',
          aberto: true
        });
        return;
      }
      
      setLoading(true);
      
      // Usar a API serverless para contornar RLS
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify({
          gameId: id,
          action: 'activate'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao ativar game');
      }
      
      setAlerta({
        mensagem: 'Game ativado com sucesso!',
        tipo: 'sucesso',
        aberto: true
      });
      
      // Notificar que o game foi atualizado
      onGameUpdated();
      
    } catch (error: any) {
      console.error('Erro ao ativar game:', error);
      setAlerta({
        mensagem: `Erro ao ativar game: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fechar alerta
  const fecharAlerta = () => {
    setAlerta(prev => ({ ...prev, aberto: false }));
  };

  const placeholderImage = '/gamerun-placeholder.png'; // Usar imagem padrão caso não tenha imagem
  
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition hover:shadow-lg">
      {/* Status Badge */}
      <div className="absolute left-4 top-4 z-10">
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          status === 'ativo' ? 'bg-green-100 text-green-800' :
          status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
          status === 'inativo' ? 'bg-gray-100 text-gray-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status === 'pendente' ? 'Pendente' :
           status === 'ativo' ? 'Ativo' :
           status === 'inativo' ? 'Inativo' : 'Encerrado'}
        </span>
      </div>
      
      {/* Imagem */}
      <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full bg-gray-100">
        <div className="relative h-full w-full">
          <SafeImage
            src={imagem_url || placeholderImage}
            alt={titulo}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100px, 96px"
            fallbackHeight={96}
            fallbackWidth={96}
          />
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-center text-xl font-semibold text-gray-900">{titulo}</h3>
        <p className="mb-4 text-sm text-gray-600">{descricao_curta}</p>
        
        <div className="mt-auto space-y-3">
          {/* Integrantes por Equipe */}
          <div className="flex items-center text-sm text-gray-500">
            <Person className="mr-2 h-4 w-4" />
            <span>{quantidade_integrantes} {quantidade_integrantes === 1 ? 'integrante' : 'integrantes'} por equipe</span>
          </div>
          
          {/* Data de Início / Countdown */}
          <div className="flex items-center text-sm text-gray-500">
            <CalendarMonth className="mr-2 h-4 w-4" />
            <span>{timeLeft}</span>
          </div>
          
          {/* Botões */}
          <div className="flex space-x-2 pt-4">
            <button
              type="button"
              onClick={() => onOpenModal(id)}
              className="flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              <SportsEsports className="mr-1 h-4 w-4" />
              Detalhes
            </button>
            
            {status === 'pendente' && (
              <button
                type="button"
                onClick={ativarGame}
                disabled={loading}
                className="flex flex-1 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none disabled:opacity-70"
              >
                <PlayArrow className="mr-1 h-4 w-4" />
                {loading ? 'Ativando...' : 'Ativar'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <AlertaPersonalizado
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        aberto={alerta.aberto}
        onClose={fecharAlerta}
      />
    </div>
  );
} 