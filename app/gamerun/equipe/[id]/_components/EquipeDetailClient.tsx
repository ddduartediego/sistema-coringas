'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Users, ArrowLeft, UserPlus, Clock, X, Check, XCircle, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Equipe {
  id: string;
  nome: string;
  status: string;
  lider_id: string;
  game_id: string;
  game: {
    titulo: string;
    descricao_curta: string;
    imagem_url: string | null;
    quantidade_integrantes: number;
  };
}

interface Integrante {
  id: string;
  integrante_id: string;
  equipe_id: string;
  status: string;
  is_owner: boolean;
  created_at: string | null;
  updated_at: string | null;
  user: {
    name: string;
    email: string;
  } | null;
}

interface EquipeDetailClientProps {
  equipeId: string;
}

export default function EquipeDetailClient({ equipeId }: EquipeDetailClientProps) {
  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [integrantesPendentes, setIntegrantesPendentes] = useState<Integrante[]>([]);
  const [integrantesAtivos, setIntegrantesAtivos] = useState<Integrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLider, setIsLider] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [novoNomeEquipe, setNovoNomeEquipe] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [processandoIntegrante, setProcessandoIntegrante] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        // Se não estiver logado, redirecionar para a página de login
        router.push("/login");
      }
    }
    getUser();
  }, [router]);

  useEffect(() => {
    if (!equipeId || !userId) return;

    async function fetchEquipeDetails() {
      try {
        setLoading(true);
        
        // Primeiro, buscar o perfil do usuário para obter o ID do perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
          
        if (profileError) {
          console.error('Erro ao buscar perfil do usuário:', profileError);
          throw new Error('Não foi possível verificar seu perfil');
        }
        
        if (!profileData || !profileData.id) {
          throw new Error('Perfil de usuário não encontrado');
        }
        
        const perfilId = profileData.id as string;
        
        // Buscar detalhes da equipe
        const { data: equipeData, error: equipeError } = await supabase
          .from("game_equipes")
          .select(`
            *,
            game:games(
              titulo,
              descricao_curta,
              imagem_url,
              quantidade_integrantes
            )
          `)
          .eq("id", equipeId)
          .single();

        if (equipeError) throw equipeError;
        
        if (!equipeData) {
          router.push("/gamerun");
          return;
        }

        setEquipe(equipeData);
        setIsLider(equipeData.lider_id === perfilId);
        
        // Buscar integrantes da equipe, incluindo os pendentes
        const { data: integrantesData, error: integrantesError } = await supabase
          .from("equipe_integrantes")
          .select(`
            id,
            equipe_id,
            integrante_id,
            status,
            is_owner,
            created_at,
            updated_at,
            user:profiles(
              name,
              email
            )
          `)
          .eq("equipe_id", equipeId)
          .order("created_at", { ascending: true });
          
        if (integrantesError) throw integrantesError;
        
        // Separar integrantes ativos e pendentes
        const ativos = integrantesData?.filter(i => i.status === 'ativo') || [];
        const pendentes = integrantesData?.filter(i => i.status === 'pendente') || [];
        
        setIntegrantes(integrantesData || []);
        setIntegrantesAtivos(ativos);
        setIntegrantesPendentes(pendentes);

        // Verificar se o usuário atual é integrante
        const isIntegrante = integrantesData?.some(i => i.integrante_id === perfilId);
        if (!isIntegrante) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta equipe.",
            variant: "destructive",
          });
          router.push("/gamerun");
        }
        
      } catch (error: any) {
        console.error("Erro ao buscar detalhes da equipe:", error);
        toast({
          title: "Erro ao carregar equipe",
          description: error.message || "Não foi possível carregar os detalhes desta equipe.",
          variant: "destructive",
        });
        router.push("/gamerun");
      } finally {
        setLoading(false);
      }
    }

    fetchEquipeDetails();
  }, [equipeId, userId, router, toast]);

  const abrirModalEditarEquipe = () => {
    if (equipe) {
      setNovoNomeEquipe(equipe.nome);
      setShowEditModal(true);
    }
  };

  const fecharModalEditarEquipe = () => {
    setShowEditModal(false);
  };

  const salvarEdicaoEquipe = async () => {
    if (!equipe || !novoNomeEquipe.trim()) return;
    
    try {
      setIsSaving(true);
      
      // Verificar se o userId é nulo antes de continuar
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }
      
      const { error } = await supabase
        .from("game_equipes")
        .update({ nome: novoNomeEquipe.trim() })
        .eq("id", equipe.id);
      
      if (error) throw error;
      
      // Atualizar o estado local
      setEquipe({
        ...equipe,
        nome: novoNomeEquipe.trim()
      });
      
      setShowEditModal(false);
      
      toast({
        title: "Equipe atualizada",
        description: "O nome da equipe foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar equipe:", error);
      toast({
        title: "Erro ao atualizar equipe",
        description: error.message || "Não foi possível atualizar o nome da equipe.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para aprovar um integrante pendente
  const aprovarIntegrante = async (integranteId: string) => {
    if (!isLider) return;
    
    try {
      setProcessandoIntegrante(integranteId);
      
      const { error } = await supabase
        .from("equipe_integrantes")
        .update({ 
          status: "ativo",
          updated_at: new Date().toISOString()
        })
        .eq("id", integranteId);
      
      if (error) throw error;
      
      // Atualizar as listas de integrantes localmente
      const integranteAprovado = integrantesPendentes.find(i => i.id === integranteId);
      
      if (integranteAprovado) {
        // Remover da lista de pendentes
        setIntegrantesPendentes(prev => prev.filter(i => i.id !== integranteId));
        
        // Adicionar à lista de ativos com status atualizado
        const integranteAtualizado = { ...integranteAprovado, status: 'ativo' };
        setIntegrantesAtivos(prev => [...prev, integranteAtualizado]);
      }
      
      toast({
        title: "Solicitação aprovada",
        description: "O integrante foi adicionado à equipe com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao aprovar integrante:", error);
      toast({
        title: "Erro ao aprovar integrante",
        description: error.message || "Não foi possível aprovar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setProcessandoIntegrante(null);
    }
  };
  
  // Função para rejeitar um integrante pendente
  const rejeitarIntegrante = async (integranteId: string) => {
    if (!isLider) return;
    
    try {
      setProcessandoIntegrante(integranteId);
      
      const { error } = await supabase
        .from("equipe_integrantes")
        .delete()
        .eq("id", integranteId);
      
      if (error) throw error;
      
      // Remover da lista de pendentes
      setIntegrantesPendentes(prev => prev.filter(i => i.id !== integranteId));
      
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de participação foi rejeitada.",
      });
    } catch (error: any) {
      console.error("Erro ao rejeitar integrante:", error);
      toast({
        title: "Erro ao rejeitar integrante",
        description: error.message || "Não foi possível rejeitar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setProcessandoIntegrante(null);
    }
  };

  // Função para remover um integrante ativo
  const removerIntegrante = async (integranteId: string) => {
    if (!isLider) return;
    
    try {
      setProcessandoIntegrante(integranteId);
      
      // Verificar se o integrante é o líder da equipe - não permitir remover o líder
      const integranteParaRemover = integrantesAtivos.find(i => i.id === integranteId);
      if (integranteParaRemover?.is_owner) {
        toast({
          title: "Operação não permitida",
          description: "Não é possível remover o líder da equipe.",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from("equipe_integrantes")
        .delete()
        .eq("id", integranteId);
      
      if (error) throw error;
      
      // Remover da lista de integrantes ativos
      setIntegrantesAtivos(prev => prev.filter(i => i.id !== integranteId));
      
      toast({
        title: "Integrante removido",
        description: "O integrante foi removido da equipe com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao remover integrante:", error);
      toast({
        title: "Erro ao remover integrante",
        description: error.message || "Não foi possível remover o integrante.",
        variant: "destructive",
      });
    } finally {
      setProcessandoIntegrante(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-500">Carregando detalhes da equipe...</p>
        </div>
      </div>
    );
  }

  if (!equipe) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">Equipe não encontrada</h3>
          <p className="text-gray-500 mt-2">A equipe que você procura não existe ou você não tem permissão para acessá-la.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/gamerun")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista de games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="outline" 
        className="mb-6"
        onClick={() => router.push(`/gamerun/${equipe.game_id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o game
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detalhes da Equipe */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <CardTitle className="text-2xl">{equipe.nome}</CardTitle>
                  <CardDescription className="mt-1">
                    Equipe para o game: <span className="font-medium">{equipe.game.titulo}</span>
                  </CardDescription>
                </div>
                <Badge variant="outline" className={
                  equipe.status === 'ativa' ? 'bg-green-50 text-green-700 border-green-200' :
                  equipe.status === 'pendente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }>
                  {equipe.status === 'ativa' ? 'Aprovada' :
                   equipe.status === 'pendente' ? 'Pendente' : 
                   'Rejeitada'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {equipe.status === 'pendente' && (
                <div className="flex items-center bg-yellow-50 border border-yellow-100 rounded-md p-4">
                  <Clock className="h-5 w-5 text-yellow-700 mr-2" />
                  <p className="text-yellow-700">Sua equipe está aguardando aprovação do administrador.</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4">Integrantes da Equipe</h3>
                
                {/* Solicitações pendentes - visível apenas para o líder */}
                {isLider && integrantesPendentes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-2 text-amber-700 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Solicitações pendentes ({integrantesPendentes.length})
                    </h4>
                    <div className="space-y-3 mb-6">
                      {integrantesPendentes.map((integrante) => (
                        <div 
                          key={integrante.id} 
                          className="flex items-center justify-between p-3 border border-amber-200 rounded-md bg-amber-50"
                        >
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 mr-3 flex-shrink-0">
                              {integrante.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium">{integrante.user?.name || 'Usuário sem nome'}</p>
                              <p className="text-sm text-gray-500">{integrante.user?.email || 'Email não disponível'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mr-2">
                              Pendente
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => aprovarIntegrante(integrante.id)}
                              disabled={processandoIntegrante === integrante.id}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => rejeitarIntegrante(integrante.id)}
                              disabled={processandoIntegrante === integrante.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Lista de integrantes ativos */}
                <div className="space-y-3">
                  {integrantesAtivos.length === 0 ? (
                    <p className="text-gray-500">Nenhum integrante ativo encontrado.</p>
                  ) : (
                    integrantesAtivos.map((integrante) => (
                      <div 
                        key={integrante.id} 
                        className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3 flex-shrink-0">
                            {integrante.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{integrante.user?.name || 'Usuário sem nome'}</p>
                            <p className="text-sm text-gray-500">{integrante.user?.email || 'Email não disponível'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {integrante.is_owner && (
                            <Badge className="mr-2 bg-blue-100 text-blue-700 border-blue-200">
                              Líder
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Ativo
                          </Badge>
                          
                          {/* Botão para remover integrante (apenas visível para o líder e não aparece para o próprio líder) */}
                          {isLider && !integrante.is_owner && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 ml-2"
                              onClick={() => removerIntegrante(integrante.id)}
                              disabled={processandoIntegrante === integrante.id}
                              title="Remover integrante"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Informações do Game</h3>
                <p className="text-gray-700 mb-2">{equipe.game.descricao_curta}</p>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {integrantes.length} de {equipe.game.quantidade_integrantes} integrantes
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              {isLider && integrantes.length < equipe.game.quantidade_integrantes && (
                <Button onClick={() => router.push(`/gamerun/equipe/${equipe.id}/convidar`)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convidar Integrante
                </Button>
              )}
              
              {!isLider && (
                <Button variant="outline" onClick={() => console.log('Sair da equipe')}>
                  Sair da Equipe
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Painel de Ações */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ações</CardTitle>
              <CardDescription>
                Gerencie sua equipe
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {isLider ? (
                <>
                  <Button 
                    className="w-full"
                    onClick={abrirModalEditarEquipe}
                  >
                    Editar Informações da Equipe
                  </Button>
                  
                  {equipe.status === 'ativa' && (
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/gamerun/equipe/${equipe.id}/gerenciar`)}
                    >
                      Gerenciar Solicitações
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center p-4 border rounded-md bg-gray-50">
                  <p className="text-gray-600">
                    Apenas o líder da equipe pode gerenciar estas configurações.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal para Editar Equipe */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">Editar Informações da Equipe</h3>
              <button 
                onClick={fecharModalEditarEquipe} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Equipe</Label>
                <Input
                  id="nome"
                  value={novoNomeEquipe}
                  onChange={(e) => setNovoNomeEquipe(e.target.value)}
                  placeholder="Digite o novo nome da equipe"
                />
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={fecharModalEditarEquipe}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={salvarEdicaoEquipe}
                disabled={!novoNomeEquipe.trim() || isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 