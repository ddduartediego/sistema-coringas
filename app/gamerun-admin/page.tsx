'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import GameCard from './components/GameCard';
import ModalGame from './components/ModalGame';
import AlertaPersonalizado from './components/AlertaPersonalizado';
import { Add as AddIcon, Refresh, SportsEsports } from '@mui/icons-material';

interface Game {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao: string;
  quantidade_integrantes: number;
  data_inicio: string | null;
  imagem_url: string | null;
  status: string;
  tipo: string;
}

export default function GameRunAdminPage() {
  const supabase = createClientComponentClient<Database>();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [gameIdSelecionado, setGameIdSelecionado] = useState<string | undefined>(undefined);
  
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });

  // Carregar games
  const carregarGames = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar games:', error);
        setAlerta({
          mensagem: `Erro ao carregar games: ${error.message}`,
          tipo: 'erro',
          aberto: true
        });
        return;
      }
      
      setGames(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar games:', error);
      setAlerta({
        mensagem: `Erro ao carregar games: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    carregarGames();
  }, []);

  // Abrir modal para criar/editar game
  const abrirModal = (gameId?: string) => {
    setGameIdSelecionado(gameId);
    setModalAberto(true);
  };
  
  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setGameIdSelecionado(undefined);
  };
  
  // Fechar alerta
  const fecharAlerta = () => {
    setAlerta(prev => ({ ...prev, aberto: false }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GameRun Admin</h1>
          <p className="mt-1 text-gray-600">Gerencie os games e as equipes participantes.</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={carregarGames}
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
          >
            <Refresh className="mr-2 h-5 w-5" />
            Atualizar
          </button>
          
          <button
            type="button"
            onClick={() => abrirModal()}
            className="flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
          >
            <AddIcon className="mr-2 h-5 w-5" />
            Novo Game
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <SportsEsports className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum game encontrado</h3>
          <p className="mt-1 text-gray-500">Clique no botão "Novo Game" para criar o primeiro.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => abrirModal()}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
            >
              <AddIcon className="-ml-1 mr-2 h-5 w-5" />
              Novo Game
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              titulo={game.titulo}
              descricao_curta={game.descricao_curta}
              data_inicio={game.data_inicio}
              quantidade_integrantes={game.quantidade_integrantes}
              imagem_url={game.imagem_url}
              status={game.status}
              tipo={game.tipo || 'Online'}
              onOpenModal={abrirModal}
              supabase={supabase}
              onGameUpdated={carregarGames}
            />
          ))}
        </div>
      )}
      
      {/* Modal de Game */}
      {modalAberto && (
        <ModalGame
          supabase={supabase}
          isOpen={modalAberto}
          onClose={fecharModal}
          onSave={carregarGames}
          gameId={gameIdSelecionado}
        />
      )}
      
      <AlertaPersonalizado
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        aberto={alerta.aberto}
        onClose={fecharAlerta}
      />
    </div>
  );
} 