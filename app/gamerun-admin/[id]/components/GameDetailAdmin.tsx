'use client';

import { useState, useEffect } from 'react';
import { 
  CalendarMonth,
  SportsEsports,
  Edit,
  People,
  FilterList,
  CheckCircle,
  DeleteOutline,
  VisibilityOutlined,
  Save,
  Close,
  ListAlt
} from '@mui/icons-material';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import SafeImage from '@/components/ui/safe-image';
import ImageUploader from '../../components/ImageUploader';
import Link from 'next/link';

// Interfaces
interface Equipe {
  id: string;
  nome: string;
  status: string;
  lider_id: string;
  lider_nome?: string;
}

interface Game {
  id?: string;
  titulo: string;
  descricao_curta: string;
  descricao: string;
  quantidade_integrantes: number;
  data_inicio: string | null;
  imagem_url: string | null;
  status: string;
  tipo: string | null;
}

interface GameDetailAdminProps {
  gameId: string;
  supabase: SupabaseClient<Database>;
  exibirAlerta: (mensagem: string, tipo: 'sucesso' | 'erro' | 'info') => void;
}

export default function GameDetailAdmin({ 
  gameId, 
  supabase,
  exibirAlerta
}: GameDetailAdminProps) {
  // Estados
  const [game, setGame] = useState<Game>({
    titulo: '',
    descricao_curta: '',
    descricao: '',
    quantidade_integrantes: 1,
    data_inicio: null,
    imagem_url: null,
    status: 'pendente',
    tipo: 'Online'
  });

  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [tiposGame, setTiposGame] = useState<{tipo: string, descricao: string}[]>([
    { tipo: 'Online', descricao: 'Game totalmente online' },
    { tipo: 'Presencial', descricao: 'Game presencial' },
    { tipo: 'Híbrido', descricao: 'Game com atividades online e presenciais' }
  ]);
  
  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<Game>({
    defaultValues: game
  });

  // Carregar dados do game
  useEffect(() => {
    const carregarGame = async () => {
      if (!gameId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
        
        if (error) {
          console.error('Erro ao carregar game:', error);
          exibirAlerta('Erro ao carregar game: ' + error.message, 'erro');
          return;
        }
        
        // Garantir que o tipo seja uma string válida
        const gameData = {
          ...data,
          tipo: data.tipo || 'Online'
        };
        
        setGame(gameData);
        reset(gameData);
        setLoading(false);
      } catch (error: any) {
        console.error('Erro ao carregar game:', error);
        exibirAlerta('Erro ao carregar game: ' + error.message, 'erro');
      }
    };
    
    carregarGame();
  }, [gameId, supabase, reset, exibirAlerta]);

  // Carregar equipes do game
  useEffect(() => {
    const carregarEquipes = async () => {
      if (!gameId) return;
      
      try {
        const { data, error } = await supabase
          .from('game_equipes')
          .select(`
            id,
            nome,
            status,
            lider_id,
            profiles!inner(id, name)
          `)
          .eq('game_id', gameId);
        
        if (error) {
          console.error('Erro ao carregar equipes:', error);
          return;
        }
        
        // Formatar os dados das equipes
        const equipesFormatadas = data.map((equipe: any) => ({
          id: equipe.id,
          nome: equipe.nome,
          status: equipe.status,
          lider_id: equipe.lider_id,
          lider_nome: equipe.profiles?.name
        }));
        
        setEquipes(equipesFormatadas);
      } catch (error) {
        console.error('Erro ao carregar equipes:', error);
      }
    };
    
    carregarEquipes();
  }, [gameId, supabase]);

  // Carregar tipos de games da tabela de configurações
  useEffect(() => {
    const carregarTiposGame = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_game')
          .select('nome, id')
          .eq('is_active', true);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Mapear os nomes dos campos para manter compatibilidade com o restante do código
          const tiposFormatados = data.map(item => ({
            tipo: item.nome, // Usando 'nome' do banco como 'tipo' na interface
            descricao: `Tipo: ${item.nome}` // Criando uma descrição padrão
          }));
          setTiposGame(tiposFormatados);
        }
      } catch (error) {
        console.error('Erro ao carregar tipos de game:', error);
      }
    };
    
    carregarTiposGame();
  }, [supabase]);

  // Alternar modo de edição
  const toggleModoEdicao = () => {
    setModoEdicao(!modoEdicao);
  };

  // Filtrar equipes por status
  const equipesFiltradas = filtroStatus === 'todos'
    ? equipes
    : equipes.filter(equipe => equipe.status === filtroStatus);

  // Aprovar equipe
  const aprovarEquipe = async (equipeId: string) => {
    try {
      const { error } = await supabase
        .from('game_equipes')
        .update({ status: 'ativa' })
        .eq('id', equipeId);
      
      if (error) {
        console.error('Erro ao aprovar equipe:', error);
        exibirAlerta('Erro ao aprovar equipe: ' + error.message, 'erro');
        return;
      }
      
      // Atualizar a lista de equipes
      setEquipes(equipes.map(equipe => 
        equipe.id === equipeId 
          ? { ...equipe, status: 'ativa' } 
          : equipe
      ));
      
      exibirAlerta('Equipe aprovada com sucesso!', 'sucesso');
    } catch (error: any) {
      console.error('Erro ao aprovar equipe:', error);
      exibirAlerta('Erro ao aprovar equipe: ' + error.message, 'erro');
    }
  };

  // Excluir equipe
  const excluirEquipe = async (equipeId: string) => {
    try {
      const { error } = await supabase
        .from('game_equipes')
        .delete()
        .eq('id', equipeId);
      
      if (error) {
        console.error('Erro ao excluir equipe:', error);
        exibirAlerta('Erro ao excluir equipe: ' + error.message, 'erro');
        return;
      }
      
      // Atualizar a lista de equipes removendo a excluída
      setEquipes(equipes.filter(equipe => equipe.id !== equipeId));
      
      exibirAlerta('Equipe excluída com sucesso!', 'sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir equipe:', error);
      exibirAlerta('Erro ao excluir equipe: ' + error.message, 'erro');
    }
  };

  // Salvar game
  const onSubmit = async (data: Game) => {
    try {
      setSaving(true);
      
      // Verificar campos obrigatórios
      if (!data.titulo || !data.descricao_curta || !data.descricao) {
        exibirAlerta('Preencha todos os campos obrigatórios!', 'erro');
        setSaving(false);
        return;
      }
      
      // Garantir que tipo tenha um valor
      const gameData = {
        ...data,
        tipo: data.tipo || 'Online'
      };
      
      // Verificar se a imagem está em processo de upload (URL começa com blob:)
      if (gameData.imagem_url?.startsWith('blob:')) {
        exibirAlerta('Aguarde o upload da imagem completar antes de salvar.', 'erro');
        setSaving(false);
        return;
      }
      
      console.log('Salvando game através da API...');
      
      // Usar a API serverless para contornar RLS
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token' // Autenticação básica, pode ser melhorada
        },
        body: JSON.stringify({
          gameId: gameId || null,
          gameData: gameData
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar game');
      }
      
      console.log('Game salvo com sucesso:', result);
      
      setSaving(false);
      setModoEdicao(false);
      exibirAlerta('Game atualizado com sucesso!', 'sucesso');
      
      // Recarregar dados do game
      const { data: updatedGame, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
        
      if (!error && updatedGame) {
        setGame(updatedGame);
        reset(updatedGame);
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar game:', error);
      exibirAlerta('Erro ao salvar game: ' + error.message, 'erro');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      {/* Botões de ação */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {modoEdicao ? 'Editar Game' : 'Detalhes do Game'}
        </h2>
        
        <div className="flex items-center space-x-2">
          {!modoEdicao ? (
            <button
              type="button"
              onClick={toggleModoEdicao}
              className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <Edit className="mr-1 h-4 w-4" />
              Editar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setModoEdicao(false);
                  reset(game);
                }}
                className="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                disabled={saving}
              >
                <Close className="mr-1 h-4 w-4" />
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                className="inline-flex items-center rounded-md bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
                disabled={saving}
              >
                <Save className="mr-1 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          )}
          
          {game.status === 'pendente' && !modoEdicao && (
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Ativar Game
            </button>
          )}
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Coluna da esquerda - Informações básicas */}
        <div className="md:col-span-2">
          {modoEdicao ? (
            /* Formulário de edição */
            <form>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Título*
                  </label>
                  <input
                    type="text"
                    {...register('titulo', { required: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição Curta*
                  </label>
                  <input
                    type="text"
                    {...register('descricao_curta', { required: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {errors.descricao_curta && (
                    <p className="mt-1 text-sm text-red-600">{errors.descricao_curta.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição Completa*
                  </label>
                  <textarea
                    {...register('descricao', { required: true })}
                    rows={5}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {errors.descricao && (
                    <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Data de Início
                    </label>
                    <input
                      type="datetime-local"
                      {...register('data_inicio')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Integrantes por Equipe*
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register('quantidade_integrantes', { 
                        required: true,
                        valueAsNumber: true,
                        min: 1
                      })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    {errors.quantidade_integrantes && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantidade_integrantes.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="ativo">Ativo</option>
                      <option value="encerrado">Encerrado</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Game
                    </label>
                    <select
                      {...register('tipo')}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      {tiposGame.map(tipo => (
                        <option key={tipo.tipo} value={tipo.tipo}>
                          {tipo.tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Exibição dos detalhes */
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{game.titulo}</h3>
                <p className="mt-1 text-gray-600">{game.descricao_curta}</p>
              </div>
              
              <div className="rounded-md bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700">Descrição Completa</h4>
                <p className="whitespace-pre-line text-gray-600">{game.descricao}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex items-center">
                    <CalendarMonth className="mr-2 h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Data de Início</h4>
                  </div>
                  <p className="mt-1 text-gray-600">
                    {game.data_inicio 
                      ? format(new Date(game.data_inicio), 'dd/MM/yyyy HH:mm') 
                      : 'Não definido'}
                  </p>
                </div>
                
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex items-center">
                    <People className="mr-2 h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Integrantes por Equipe</h4>
                  </div>
                  <p className="mt-1 text-gray-600">
                    {game.quantidade_integrantes} 
                    {game.quantidade_integrantes === 1 ? ' integrante' : ' integrantes'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex items-center">
                    <SportsEsports className="mr-2 h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Tipo</h4>
                  </div>
                  <p className="mt-1 text-gray-600">{game.tipo || 'Online'}</p>
                </div>
                
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="flex items-center">
                    <FilterList className="mr-2 h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Status</h4>
                  </div>
                  <p className="mt-1">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      game.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      game.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      game.status === 'inativo' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {game.status === 'pendente' ? 'Pendente' :
                      game.status === 'ativo' ? 'Ativo' :
                      game.status === 'inativo' ? 'Inativo' : 'Encerrado'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <Link
                  href={`/gamerun-admin/${gameId}/quests`}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <ListAlt className="mr-2 h-5 w-5 text-gray-500" />
                  Gerenciar Quests
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Coluna da direita - Imagem e equipes */}
        <div className="space-y-6">
          {/* Imagem do Game */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900">Imagem do Game</h3>
              <div className="mt-2">
                {modoEdicao ? (
                  <ImageUploader
                    currentImageUrl={game.imagem_url || ''}
                    onImageUploaded={(url) => setValue('imagem_url', url)}
                  />
                ) : (
                  <div className="relative overflow-hidden rounded-md border border-gray-200 bg-gray-100" style={{ height: '200px' }}>
                    <SafeImage
                      src={game.imagem_url || '/gamerun-placeholder.png'}
                      alt={game.titulo}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 400px"
                      fallbackHeight={200}
                      fallbackWidth={400}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Equipes */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Equipes</h3>
                
                <div>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="todos">Todas</option>
                    <option value="pendente">Pendentes</option>
                    <option value="ativa">Ativas</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                {equipesFiltradas.length === 0 ? (
                  <div className="py-4 text-center text-gray-500">
                    <People className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p>Nenhuma equipe encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {equipesFiltradas.map((equipe) => (
                      <div key={equipe.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{equipe.nome}</h4>
                            <p className="text-sm text-gray-600">Líder: {equipe.lider_nome}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              equipe.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {equipe.status === 'ativa' ? 'Ativa' : 'Pendente'}
                            </span>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => window.open(`/gamerun/equipe/${equipe.id}/view`, '_blank')}
                                className="text-gray-500 hover:text-blue-600"
                                title="Ver detalhes"
                              >
                                <VisibilityOutlined className="h-5 w-5" />
                              </button>
                              
                              {equipe.status === 'pendente' && (
                                <button
                                  type="button"
                                  onClick={() => aprovarEquipe(equipe.id)}
                                  className="text-gray-500 hover:text-green-600"
                                  title="Aprovar equipe"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => excluirEquipe(equipe.id)}
                                className="text-gray-500 hover:text-red-600"
                                title="Excluir equipe"
                              >
                                <DeleteOutline className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 