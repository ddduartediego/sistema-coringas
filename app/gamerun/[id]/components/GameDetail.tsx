'use client';

import { useState, useEffect } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { formatDate, toLocalTime, isBeforeNow } from '@/lib/utils/date';
import CountdownTimer from "@/components/CountdownTimer";
import { supabase } from "@/lib/supabase/client";

interface GameDetailProps {
  gameId: string;
}

interface Game {
  id: string;
  nome: string;
  descricao: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
}

export default function GameDetail({ gameId }: GameDetailProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Carregar dados do game
  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (error) throw error;
        setGame(data);
      } catch (error) {
        console.error('Erro ao carregar o game:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGame();
  }, [gameId]);

  // Funções de manipulação de data
  const dataEhPassada = (dataString: string | null) => {
    return isBeforeNow(dataString);
  };

  const formatarData = (dataString: string | null) => {
    return formatDate(dataString, "dd 'de' MMMM 'de' yyyy 'às' HH:mm");
  };

  // Renderizar contador
  const renderizarContador = () => {
    if (!game) return null;

    const agora = new Date();
    
    // Verificar se já começou
    if (game.data_inicio && toLocalTime(new Date(game.data_inicio)) > agora) {
      return (
        <div className="mb-8 flex flex-col items-center justify-center rounded-lg bg-primary-50 p-6 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-medium text-primary-600">Contagem regressiva para o início</h3>
          <CountdownTimer targetDate={toLocalTime(new Date(game.data_inicio))} />
        </div>
      );
    }
    
    // Verificar se já acabou
    if (game.data_fim && dataEhPassada(game.data_fim)) {
      return (
        <div className="mb-8 flex flex-col items-center justify-center rounded-lg bg-gray-50 p-6 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-medium text-gray-600">Game encerrado</h3>
          <p className="text-sm text-gray-500">Este game já foi encerrado em {formatarData(game.data_fim)}</p>
        </div>
      );
    }
    
    // Em andamento, verificar se tem data de fim
    if (game.data_fim) {
      return (
        <div className="mb-8 flex flex-col items-center justify-center rounded-lg bg-green-50 p-6 text-center shadow-sm">
          <h3 className="mb-2 text-lg font-medium text-green-600">Game em andamento</h3>
          <p className="mb-2 text-sm text-green-600">Termina em</p>
          <CountdownTimer targetDate={toLocalTime(new Date(game.data_fim))} />
        </div>
      );
    }
    
    // Em andamento sem data de fim
    return (
      <div className="mb-8 flex flex-col items-center justify-center rounded-lg bg-green-50 p-6 text-center shadow-sm">
        <h3 className="text-lg font-medium text-green-600">Game em andamento</h3>
        <p className="text-sm text-green-500">Não há data definida para o término</p>
      </div>
    );
  };

  // No JSX onde são exibidas datas, usar a função formatarData
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {loading ? (
        <div className="flex justify-center py-12">
          <p>Carregando...</p>
        </div>
      ) : game ? (
        <>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{game.nome}</h1>
          
          {game.descricao && (
            <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold text-gray-800">Descrição</h2>
              <p className="text-gray-600">{game.descricao}</p>
            </div>
          )}
          
          {/* Exibição de datas */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {game.data_inicio && (
              <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <span className="text-sm font-medium text-gray-500">Data de Início</span>
                <span className="mt-1 flex items-center text-base font-medium text-gray-900">
                  <CalendarIcon className="mr-1.5 h-5 w-5 text-gray-400" />
                  {formatarData(game.data_inicio)}
                </span>
              </div>
            )}
            
            {game.data_fim && (
              <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <span className="text-sm font-medium text-gray-500">Data de Término</span>
                <span className="mt-1 flex items-center text-base font-medium text-gray-900">
                  <Clock className="mr-1.5 h-5 w-5 text-gray-400" />
                  {formatarData(game.data_fim)}
                </span>
              </div>
            )}
          </div>
          
          {/* Contagem regressiva */}
          {renderizarContador()}
        </>
      ) : (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Game não encontrado</h2>
          <p className="mt-2 text-gray-600">O game solicitado não existe ou foi removido.</p>
        </div>
      )}
    </div>
  );
} 