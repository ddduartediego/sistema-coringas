'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronDown, ChevronUp, Eye, UserPlus, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';

interface Equipe {
  id: string;
  nome: string;
  status: string;
  lider_id: string;
  lider_nome: string;
  total_integrantes: number;
}

interface ListaEquipesInscritasProps {
  gameId: string;
  onParticipacaoSolicitada?: () => void;
  quantidadeMaximaIntegrantes?: number;
}

export default function ListaEquipesInscritas({ gameId, onParticipacaoSolicitada, quantidadeMaximaIntegrantes }: ListaEquipesInscritasProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarCompletas, setMostrarCompletas] = useState(true);
  const [mostrarDisponiveis, setMostrarDisponiveis] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [jaInscrito, setJaInscrito] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [equipeSolicitada, setEquipeSolicitada] = useState<string>("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [equipeNomeSolicitada, setEquipeNomeSolicitada] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!gameId) return;
    
    async function carregarEquipes() {
      try {
        setLoading(true);
        console.log('Iniciando carregamento de equipes para o game:', gameId);
        
        // Verificar se temos um ID de game válido
        if (!gameId || typeof gameId !== 'string') {
          console.error('ID de game inválido:', gameId);
          throw new Error(`ID de game inválido: ${gameId}`);
        }
        
        // Verificar cliente Supabase
        if (!supabase || !supabase.from) {
          console.error('Cliente Supabase inválido');
          throw new Error('Cliente Supabase não foi inicializado corretamente');
        }
        
        console.log('Buscando equipes diretamente...');
        console.log('URL do Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        
        // Tentar o método direto primeiro (devido ao erro com RPC)
        const { data: equipesDiretas, error: errorDireto } = await supabase
          .from('game_equipes')
          .select('id, nome, status, lider_id')
          .eq('game_id', gameId)
          .order('created_at', { ascending: false });
        
        if (errorDireto) {
          console.error('Erro ao buscar equipes diretamente:', errorDireto);
          // Logs detalhados para erros
          if (errorDireto.code) {
            console.error(`Código do erro: ${errorDireto.code}`);
          }
          if (errorDireto.details) {
            console.error(`Detalhes do erro: ${errorDireto.details}`);
          }
          if (errorDireto.hint) {
            console.error(`Dica do erro: ${errorDireto.hint}`);
          }
          throw new Error(`Falha ao carregar equipes: ${errorDireto.message || 'Erro desconhecido'}`);
        }
        
        if (!equipesDiretas || equipesDiretas.length === 0) {
          console.log('Nenhuma equipe encontrada para este game');
          setEquipes([]);
          return;
        }
        
        console.log(`Encontradas ${equipesDiretas.length} equipes, processando...`);
        
        // Processar cada equipe manualmente
        const equipesProcessadas = await Promise.all(equipesDiretas.map(async (equipe) => {
          // Buscar informações do líder
          const { data: liderData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', equipe.lider_id)
            .single();
            
          // Contar integrantes
          const { count: totalIntegrantes } = await supabase
            .from('equipe_integrantes')
            .select('id', { count: 'exact', head: true })
            .eq('equipe_id', equipe.id);
            
          return {
            id: equipe.id,
            nome: equipe.nome,
            status: equipe.status,
            lider_id: equipe.lider_id,
            lider_nome: liderData?.name || 'Desconhecido',
            total_integrantes: totalIntegrantes || 0
          };
        }));
        
        console.log('Equipes processadas com sucesso:', equipesProcessadas);
        setEquipes(equipesProcessadas);
      } catch (error: any) {
        console.error('Erro ao carregar equipes:', error);
        let mensagemErro = "Não foi possível carregar as equipes inscritas.";
        
        if (error instanceof Error) {
          mensagemErro = error.message;
        } else if (typeof error === 'object' && error !== null) {
          mensagemErro = JSON.stringify(error);
        }
        
        toast({
          title: 'Erro ao carregar equipes',
          description: mensagemErro,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    carregarEquipes();
  }, [gameId, toast]);
  
  // Buscar informações do usuário logado
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        
        // Buscar o perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single();
          
        if (!profileError && profileData) {
          setPerfilId(profileData.id);
        }
      }
    }
    
    getUser();
  }, []);
  
  // Verificar se o usuário já está inscrito em alguma equipe deste game
  useEffect(() => {
    if (!perfilId || !gameId) return;
    
    async function verificarInscricao() {
      try {
        // Buscar todas as equipes do game
        const { data: equipes, error: equipesError } = await supabase
          .from('game_equipes')
          .select('id')
          .eq('game_id', gameId);
        
        if (equipesError) throw equipesError;
        
        if (equipes && equipes.length > 0) {
          const equipesIds = equipes.map(e => e.id);
          
          // Verificar se o usuário é integrante de alguma dessas equipes
          const { data: participacoes, error: participacoesError } = await supabase
            .from('equipe_integrantes')
            .select('equipe_id, status')
            .eq('integrante_id', perfilId as string) // Força o tipo como string
            .in('equipe_id', equipesIds);
          
          if (participacoesError) throw participacoesError;
          
          // Se encontrou alguma participação, o usuário já está inscrito
          setJaInscrito(participacoes !== null && participacoes.length > 0);
        }
      } catch (error) {
        console.error('Erro ao verificar inscrição:', error);
      }
    }
    
    verificarInscricao();
  }, [gameId, perfilId]);
  
  // Filtrar equipes com base na quantidade de integrantes
  const equipesCompletas = equipes.filter(equipe => 
    equipe.status === 'ativa' && 
    quantidadeMaximaIntegrantes !== undefined && 
    equipe.total_integrantes >= quantidadeMaximaIntegrantes
  );
  
  const equipesDisponiveis = equipes.filter(equipe => 
    equipe.status === 'ativa' && 
    (quantidadeMaximaIntegrantes === undefined || 
    equipe.total_integrantes < quantidadeMaximaIntegrantes)
  );
  
  // Solicitar participação em uma equipe
  const solicitarParticipacao = async (equipeId: string, equipeName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!perfilId) {
      toast({
        title: "Erro ao solicitar participação",
        description: "Você precisa estar logado para solicitar participação em uma equipe.",
        variant: "destructive",
      });
      return;
    }
    
    // Garantir que perfilId é uma string
    const perfilIdString = String(perfilId);
    
    if (jaInscrito) {
      toast({
        title: "Você já está inscrito",
        description: "Você já participa ou solicitou participação em uma equipe deste game.",
        variant: "destructive",
      });
      return;
    }

    if (quantidadeMaximaIntegrantes !== undefined) {
      try {
        // Buscar todos os integrantes da equipe para verificar a quantidade
        const { data: integrantesEquipe, error } = await supabase
          .from('equipe_integrantes')
          .select('id')
          .eq('equipe_id', equipeId);
          
        if (error) throw error;
        
        // Verificar se o número de integrantes já atingiu o máximo
        const totalIntegrantes = integrantesEquipe ? integrantesEquipe.length : 0;
        
        if (totalIntegrantes >= quantidadeMaximaIntegrantes) {
          toast({
            title: "Equipe com limite máximo de integrantes",
            description: `Esta equipe já atingiu o limite máximo de ${quantidadeMaximaIntegrantes} integrantes.`,
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar número de integrantes:', error);
      }
    }
    
    try {
      setSolicitando(true);
      
      // Inserir o usuário como integrante com status pendente
      const { error } = await supabase
        .from('equipe_integrantes')
        .insert({
          equipe_id: equipeId,
          integrante_id: perfilIdString,
          status: 'pendente',
          is_owner: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Atualizar o estado para impedir novas solicitações
      setJaInscrito(true);
      // Guardar a equipe solicitada para exibir a mensagem
      setEquipeSolicitada(equipeId);
      setEquipeNomeSolicitada(equipeName);
      
      // Abrir o dialog em vez de mostrar o toast
      setDialogAberto(true);
    } catch (error: any) {
      console.error('Erro ao solicitar participação:', error);
      toast({
        title: "Erro ao solicitar participação",
        description: error.message || "Não foi possível enviar sua solicitação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSolicitando(false);
    }
  };

  // Função para fechar o dialog e atualizar a página
  const fecharDialogEAtualizar = () => {
    setDialogAberto(false);
    
    // Notificar o componente pai que a participação foi solicitada
    if (onParticipacaoSolicitada) {
      onParticipacaoSolicitada();
    }
    
    // Atualizar a página com uma recarga completa para garantir que todos os componentes sejam atualizados
    window.location.reload();
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Equipes Inscritas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (equipes.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Equipes Inscritas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Nenhuma equipe inscrita neste game ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Equipes Inscritas</CardTitle>
        <CardDescription>
          Confira as equipes que já estão participando deste game.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Equipes Disponíveis */}
        {equipesDisponiveis.length > 0 && (
          <div className="mb-6">
            <div 
              className="flex items-center justify-between cursor-pointer mb-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setMostrarDisponiveis(!mostrarDisponiveis)}
            >
              <h3 className="text-lg font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
                  {equipesDisponiveis.length}
                </Badge>
                Equipes Disponíveis
              </h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {mostrarDisponiveis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {mostrarDisponiveis && (
              <div className="space-y-2 ml-1 border-l-2 border-green-200 pl-3">
                {equipesDisponiveis.map(equipe => (
                  <div 
                    key={equipe.id} 
                    className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="cursor-pointer" onClick={() => router.push(`/gamerun/equipe/${equipe.id}/view`)}>
                        <h4 className="font-medium group-hover:text-primary-600 transition-colors">{equipe.nome}</h4>
                        <div className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">Líder: {equipe.lider_nome}</span>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 text-gray-500 mr-1" />
                            <span>{equipe.total_integrantes}</span>
                            {quantidadeMaximaIntegrantes !== undefined && (
                              <span className="ml-1 text-xs">
                                / {quantidadeMaximaIntegrantes}
                                {equipe.total_integrantes >= quantidadeMaximaIntegrantes && (
                                  <span className="ml-1 text-red-500 font-medium">(Completo)</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/gamerun/equipe/${equipe.id}/view`);
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para solicitar participação */}
                          {perfilId && !jaInscrito && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => solicitarParticipacao(equipe.id, equipe.nome, e)}
                              disabled={solicitando}
                              className="text-blue-600 hover:text-blue-700"
                              title="Solicitar participação"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Equipes Completas */}
        {equipesCompletas.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer mb-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setMostrarCompletas(!mostrarCompletas)}
            >
              <h3 className="text-lg font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-gray-100 text-gray-700 border-gray-200">
                  {equipesCompletas.length}
                </Badge>
                Equipes Completas
              </h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {mostrarCompletas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {mostrarCompletas && (
              <div className="space-y-2 ml-1 border-l-2 border-gray-200 pl-3">
                {equipesCompletas.map(equipe => (
                  <div 
                    key={equipe.id} 
                    className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="cursor-pointer" onClick={() => router.push(`/gamerun/equipe/${equipe.id}/view`)}>
                        <h4 className="font-medium group-hover:text-primary-600 transition-colors">{equipe.nome}</h4>
                        <div className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">Líder: {equipe.lider_nome}</span>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 text-gray-500 mr-1" />
                            <span>{equipe.total_integrantes}</span>
                            {quantidadeMaximaIntegrantes !== undefined && (
                              <span className="ml-1 text-xs">
                                / {quantidadeMaximaIntegrantes}
                                {equipe.total_integrantes >= quantidadeMaximaIntegrantes && (
                                  <span className="ml-1 text-red-500 font-medium">(Completo)</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/gamerun/equipe/${equipe.id}/view`);
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Botão para solicitar participação (sempre desabilitado) */}
                          {perfilId && !jaInscrito && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={true}
                              className="text-gray-400 cursor-not-allowed"
                              title={`Equipe atingiu o limite máximo de ${quantidadeMaximaIntegrantes} integrantes`}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog de confirmação */}
      <Transition appear show={dialogAberto} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Solicitação Enviada
                  </Dialog.Title>
                  
                  <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-100 flex items-start">
                    <Check className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-700">
                      Sua solicitação para participar da equipe <span className="font-medium">{equipeNomeSolicitada}</span> foi enviada e está aguardando aprovação do líder.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={fecharDialogEAtualizar}
                      className="w-32"
                    >
                      OK
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Card>
  );
} 