'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  Close, 
  CalendarMonth,
  SportsEsports,
  Edit,
  People,
  FilterList,
  CheckCircle,
  DeleteOutline,
  VisibilityOutlined
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import AlertaPersonalizado from './AlertaPersonalizado';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import Image from 'next/image';
import ImageUploader from './ImageUploader';
import SafeImage from '../../../components/ui/safe-image';

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
  tipo: string;
}

interface ModalGameProps {
  supabase: SupabaseClient<Database>;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  gameId?: string;
}

// Validação do formulário
const gameSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao_curta: z.string().min(5, 'Descrição curta deve ter no mínimo 5 caracteres'),
  descricao: z.string().min(10, 'Descrição completa deve ter no mínimo 10 caracteres'),
  quantidade_integrantes: z.number().min(1, 'Quantidade de integrantes deve ser no mínimo 1'),
  data_inicio: z.string().optional(),
  imagem_url: z.string().optional(),
  status: z.string(),
  tipo: z.string()
});

export default function ModalGame({ 
  supabase, 
  isOpen, 
  onClose, 
  onSave,
  gameId 
}: ModalGameProps) {
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
  
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });
  
  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<Game>({
    defaultValues: game
  });

  // Carregar dados do game
  useEffect(() => {
    const carregarGame = async () => {
      if (!gameId) {
        setModoEdicao(true);
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
          setAlerta({
            mensagem: 'Erro ao carregar game: ' + error.message,
            tipo: 'erro',
            aberto: true
          });
          return;
        }
        
        setGame(data);
        reset(data);
        setLoading(false);
      } catch (error: any) {
        console.error('Erro ao carregar game:', error);
        setAlerta({
          mensagem: 'Erro ao carregar game: ' + error.message,
          tipo: 'erro',
          aberto: true
        });
      }
    };
    
    if (isOpen) {
      carregarGame();
    }
  }, [isOpen, gameId, supabase, reset]);

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
    
    if (isOpen && gameId) {
      carregarEquipes();
    }
  }, [isOpen, gameId, supabase]);

  // Carregar tipos de games da tabela de configurações
  useEffect(() => {
    const carregarTiposGame = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_game')
          .select('tipo, descricao')
          .eq('ativo', true);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTiposGame(data);
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
        setAlerta({
          mensagem: 'Erro ao aprovar equipe: ' + error.message,
          tipo: 'erro',
          aberto: true
        });
        return;
      }
      
      // Atualizar a lista de equipes
      setEquipes(equipes.map(equipe => 
        equipe.id === equipeId 
          ? { ...equipe, status: 'ativa' } 
          : equipe
      ));
      
      setAlerta({
        mensagem: 'Equipe aprovada com sucesso!',
        tipo: 'sucesso',
        aberto: true
      });
    } catch (error: any) {
      console.error('Erro ao aprovar equipe:', error);
      setAlerta({
        mensagem: 'Erro ao aprovar equipe: ' + error.message,
        tipo: 'erro',
        aberto: true
      });
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
        setAlerta({
          mensagem: 'Erro ao excluir equipe: ' + error.message,
          tipo: 'erro',
          aberto: true
        });
        return;
      }
      
      // Atualizar a lista de equipes removendo a excluída
      setEquipes(equipes.filter(equipe => equipe.id !== equipeId));
      
      setAlerta({
        mensagem: 'Equipe excluída com sucesso!',
        tipo: 'sucesso',
        aberto: true
      });
    } catch (error: any) {
      console.error('Erro ao excluir equipe:', error);
      setAlerta({
        mensagem: 'Erro ao excluir equipe: ' + error.message,
        tipo: 'erro',
        aberto: true
      });
    }
  };

  // Salvar game
  const onSubmit = async (data: Game) => {
    try {
      setSaving(true);
      
      // Verificar campos obrigatórios
      if (!data.titulo || !data.descricao_curta || !data.descricao) {
        setAlerta({
          mensagem: 'Preencha todos os campos obrigatórios!',
          tipo: 'erro',
          aberto: true
        });
        setSaving(false);
        return;
      }
      
      // Verificar se a imagem está em processo de upload (URL começa com blob:)
      if (data.imagem_url?.startsWith('blob:')) {
        setAlerta({
          mensagem: 'Aguarde o upload da imagem completar antes de salvar.',
          tipo: 'erro',
          aberto: true
        });
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
          gameData: data
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar game');
      }
      
      console.log('Game salvo com sucesso:', result);
      
      setSaving(false);
      setModoEdicao(false);
      setAlerta({
        mensagem: gameId ? 'Game atualizado com sucesso!' : 'Game criado com sucesso!',
        tipo: 'sucesso',
        aberto: true
      });
      
      // Recarregar lista de games
      onSave();
      
      // Fechar modal se for novo game
      if (!gameId) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro ao salvar game:', error);
      setAlerta({
        mensagem: 'Erro ao salvar game: ' + error.message,
        tipo: 'erro',
        aberto: true
      });
      setSaving(false);
    }
  };

  // Fechar alerta
  const fecharAlerta = () => {
    setAlerta(prev => ({ ...prev, aberto: false }));
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl"
        >
          {/* Cabeçalho */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-2xl font-semibold text-gray-800">
              {gameId ? (modoEdicao ? 'Editar Game' : 'Detalhes do Game') : 'Novo Game'}
            </Dialog.Title>
            
            <div className="flex items-center space-x-2">
              {gameId && !modoEdicao && (
                <button
                  type="button"
                  onClick={toggleModoEdicao}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
              
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                disabled={saving}
              >
                <Close className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {modoEdicao ? (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="col-span-2">
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
                    
                    <div className="col-span-2">
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
                    
                    <div className="col-span-2">
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Quantidade de Integrantes por Equipe*
                      </label>
                      <Controller
                        name="quantidade_integrantes"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            min={1}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        )}
                      />
                      {errors.quantidade_integrantes && (
                        <p className="mt-1 text-sm text-red-600">{errors.quantidade_integrantes.message}</p>
                      )}
                    </div>
                    
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
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Imagem do Game
                      </label>
                      <ImageUploader
                        currentImageUrl={watch('imagem_url') || null}
                        onImageUploaded={(url) => setValue('imagem_url', url)}
                      />
                    </div>
                    
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
                        <option value="inativo">Inativo</option>
                        <option value="encerrado">Encerrado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo do Game
                      </label>
                      <select
                        {...register('tipo')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {tiposGame.map((tipo) => (
                          <option key={tipo.tipo} value={tipo.tipo}>
                            {tipo.tipo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (gameId) {
                          setModoEdicao(false);
                          reset(game);
                        } else {
                          onClose();
                        }
                      }}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none disabled:opacity-70"
                      disabled={saving}
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Informações do Game</h3>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Título</h4>
                        <p className="mt-1 text-base text-gray-900">{game.titulo}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
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
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Quantidade de Integrantes por Equipe</h4>
                        <p className="mt-1 flex items-center text-base text-gray-900">
                          <People className="mr-1 h-4 w-4 text-gray-400" />
                          {game.quantidade_integrantes}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Data de Início</h4>
                        <p className="mt-1 flex items-center text-base text-gray-900">
                          <CalendarMonth className="mr-1 h-4 w-4 text-gray-400" />
                          {game.data_inicio ? format(new Date(game.data_inicio), 'dd/MM/yyyy HH:mm') : 'Não definida'}
                        </p>
                      </div>
                      
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Descrição Curta</h4>
                        <p className="mt-1 text-base text-gray-900">{game.descricao_curta}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Descrição Completa</h4>
                        <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 p-3 text-base text-gray-900">
                          {game.descricao}
                        </div>
                      </div>

                      {game.imagem_url && (
                        <div className="col-span-2 mt-4">
                          <h4 className="text-sm font-medium text-gray-500">Imagem</h4>
                          <div className="mt-2 relative h-[200px] w-full rounded-lg overflow-hidden border border-gray-200">
                            <SafeImage
                              src={game.imagem_url}
                              alt={game.titulo}
                              fill
                              className="object-contain"
                              fallbackHeight={200}
                              fallbackWidth={400}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {gameId && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-800">Equipes Inscritas</h3>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Filtrar:</span>
                          <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="todos">Todos</option>
                            <option value="pendente">Pendente</option>
                            <option value="ativa">Ativa</option>
                            <option value="rejeitada">Rejeitada</option>
                          </select>
                        </div>
                      </div>
                      
                      {equipesFiltradas.length === 0 ? (
                        <div className="rounded-md bg-gray-50 p-4 text-center text-gray-500">
                          Nenhuma equipe encontrada.
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                  Nome da Equipe
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                  Líder
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {equipesFiltradas.map((equipe) => (
                                <tr key={equipe.id}>
                                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                    {equipe.nome}
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {equipe.lider_nome || '-'}
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                      equipe.status === 'ativa' ? 'bg-green-100 text-green-800' :
                                      equipe.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {equipe.status === 'pendente' ? 'Pendente' :
                                       equipe.status === 'ativa' ? 'Ativa' : 'Rejeitada'}
                                    </span>
                                  </td>
                                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                                        title="Visualizar equipe"
                                        onClick={() => window.open(`/gamerun/equipe/${equipe.id}/view`, '_blank')}
                                      >
                                        <VisibilityOutlined fontSize="small" />
                                      </button>
                                      
                                      {equipe.status === 'pendente' && (
                                        <button
                                          onClick={() => aprovarEquipe(equipe.id)}
                                          className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100"
                                          title="Aprovar equipe"
                                        >
                                          <CheckCircle fontSize="small" />
                                        </button>
                                      )}
                                      
                                      <button
                                        onClick={() => excluirEquipe(equipe.id)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100"
                                        title="Excluir equipe"
                                      >
                                        <DeleteOutline fontSize="small" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <AlertaPersonalizado
            mensagem={alerta.mensagem}
            tipo={alerta.tipo}
            aberto={alerta.aberto}
            onClose={fecharAlerta}
          />
        </motion.div>
      </div>
    </Dialog>
  );
} 