"use client";

import { useEffect, useState } from "react";
import { Database } from '@/lib/database.types';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { Refresh, SportsEsports } from '@mui/icons-material';
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { motion } from 'framer-motion';
import SafeImage from '@/components/ui/safe-image';
import AlertaPersonalizado from '../gamerun-admin/components/AlertaPersonalizado';
import { useServerDate } from '@/lib/hooks/useServerDate';

interface Game {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao: string;
  quantidade_integrantes: number;
  data_inicio: string | null;
  imagem_url: string | null;
  status: string;
  tipo: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function GameRunPage() {
  const supabase = createClientSupabaseClient();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { 
    serverDate, 
    isLoading: isLoadingServerDate, 
    isDateBeforeServerDate 
  } = useServerDate();
  
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });

  // Carregar games ativos
  const carregarGames = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("status", "ativo")
        .order("data_inicio", { ascending: true });

      if (error) {
        throw error;
      }

      setGames(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar games:", error);
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

  // Fechar alerta
  const fecharAlerta = () => {
    setAlerta(prev => ({ ...prev, aberto: false }));
  };

  // Formatar data para exibição
  function formatarData(dataString: string | null) {
    if (!dataString) return "Data não definida";
    return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  // Calcular tempo para o início do game
  function calcularTempoRestante(dataString: string | null) {
    if (!dataString) return "Data não definida";
    
    // Usar a data do servidor se disponível, senão usar a data local
    const agora = serverDate || new Date();
    const dataInicio = new Date(dataString);
    
    if (agora > dataInicio) {
      return "Em andamento";
    }
    
    try {
      return formatDistanceToNow(dataInicio, { 
        locale: ptBR, 
        addSuffix: true 
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return "Data inválida";
    }
  }

  const placeholderImage = '/gamerun-placeholder.png'; // Usar imagem padrão caso não tenha imagem
  const isPageLoading = loading || isLoadingServerDate;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-lg bg-blue-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">GameRun - Jogos Disponíveis</h1>
        <p className="mt-1 text-gray-600">Confira os games disponíveis e participe com sua equipe.</p>
      </div>
      {isPageLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <SportsEsports className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum game disponível no momento</h3>
          <p className="mt-1 text-gray-500">Fique atento! Novos games serão anunciados em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {games.map((game) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition hover:shadow-lg"
            >
              {/* Status Badge */}
              <div className="absolute left-4 top-4 z-10 flex flex-col space-y-2">
                <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                  Ativo
                </span>
                <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                  {game.tipo || 'Online'}
                </span>
              </div>
              
              {/* Imagem */}
              <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full bg-gray-100">
                <div className="relative h-full w-full">
                  <SafeImage
                    src={game.imagem_url || placeholderImage}
                    alt={game.titulo}
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
                <h3 className="mb-2 text-center text-xl font-semibold text-gray-900">{game.titulo}</h3>
                <p className="mb-4 text-sm text-gray-600">{game.descricao_curta}</p>
                
                <div className="mt-auto space-y-3">
                  {/* Integrantes por Equipe */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-block mr-2 h-4 w-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <span>{game.quantidade_integrantes} {game.quantidade_integrantes === 1 ? 'integrante' : 'integrantes'} por equipe</span>
                  </div>
                  
                  {/* Data de Início / Countdown */}
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="inline-block mr-2 h-4 w-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </span>
                    <span>{calcularTempoRestante(game.data_inicio)}</span>
                  </div>
                  
                  {/* Botões */}
                  <div className="flex pt-4 space-x-2">
                    <Link 
                      href={`/gamerun/${game.id}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
                    >
                      <span className="inline-block mr-2 h-4 w-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </span>
                      Ver Detalhes
                    </Link>
                    {isDateBeforeServerDate(game.data_inicio) && (
                      <Link 
                        href={`/gamerun/${game.id}/quests`}
                        className="flex flex-1 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                      >
                        <span className="inline-block mr-2 h-4 w-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
                          </svg>
                        </span>
                        Entrar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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