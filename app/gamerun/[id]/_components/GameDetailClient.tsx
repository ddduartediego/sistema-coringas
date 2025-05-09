'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Users, ArrowLeft, UserPlus, Clock, CheckCircle, AlertCircle, XCircle, X } from "lucide-react";
import SafeImage from "@/components/ui/safe-image";
import ModalCriarEquipe from "./ModalCriarEquipe";
import ListaEquipesInscritas from "./ListaEquipesInscritas";

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
}

interface EquipeAtual {
  id: string;
  nome: string;
  status: string;
  participante: boolean;
  is_owner?: boolean;
  lider_nome?: string;
  status_integrante?: string;
  integrantes?: Array<{
    id: string;
    integrante_id: string;
    status: string;
    is_owner: boolean;
    user: {
      name: string;
    } | null;
  }>;
  total_integrantes: number;
}

interface GameEquipe {
  id: string;
  nome: string;
  status: string;
  game_id: string;
}

interface EquipeData {
  equipe_id: string;
  game_equipes: GameEquipe;
}

interface GameDetailClientProps {
  gameId: string;
}

export default function GameDetailClient({ gameId }: GameDetailClientProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipeAtual, setEquipeAtual] = useState<EquipeAtual | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalCriarEquipeAberto, setModalCriarEquipeAberto] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    }
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      console.log('ID do usuário está disponível, carregando detalhes do game e equipe...');
      fetchGameDetails();
    } else if (gameId) {
      // Se não tiver usuário, ainda carrega os detalhes do game, mas não tenta buscar equipe
      console.log('Usuário não logado, carregando apenas detalhes do game...');
      loadGameOnly();
    }
  }, [gameId, userId]);

  // Função para buscar detalhes do game e da equipe do usuário
  async function fetchGameDetails() {
    if (!gameId) return;
    
    try {
      setLoading(true);
      // Buscar detalhes do game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("status", "ativo")
        .single();

      if (gameError) {
        throw gameError;
      }

      if (!gameData) {
        router.push("/gamerun");
        return;
      }

      setGame(gameData);

      // Se tiver usuário logado, verificar se já está inscrito em alguma equipe
      if (userId) {
        console.log('Verificando se o usuário está em alguma equipe do game:', gameId);
        
        // Primeiro, buscar o perfil do usuário para obter o ID do perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
          
        if (profileError || !profileData) {
          console.error('Erro ao buscar perfil do usuário:', profileError);
          toast({
            title: "Não foi possível verificar sua equipe",
            description: "Houve um problema ao verificar seu perfil. Tente novamente mais tarde.",
            variant: "destructive",
          });
          setEquipeAtual(null);
          return;
        }
        
        const perfilId = profileData.id;
        console.log('ID do perfil do usuário:', perfilId);
        
        // Buscar todas as equipes do game
        const { data: equipes, error: equipesError } = await supabase
          .from('game_equipes')
          .select('id')
          .eq('game_id', gameId);
        
        if (equipesError) {
          console.error('Erro ao buscar equipes do game:', equipesError);
          toast({
            title: "Erro ao verificar equipes",
            description: "Não foi possível verificar as equipes do game. Tente novamente mais tarde.",
            variant: "destructive",
          });
          setEquipeAtual(null);
          return;
        }
        
        if (equipes && equipes.length > 0) {
          console.log(`Encontradas ${equipes.length} equipes, verificando participação...`);
          const equipesIds = equipes.map(e => e.id);
          
          // Verificar se o usuário é integrante de alguma dessas equipes (agora sem filtrar por status)
          const { data: participacoes, error: participacoesError } = await supabase
            .from('equipe_integrantes')
            .select('*')
            .eq('integrante_id', perfilId)
            .in('equipe_id', equipesIds);
          
          if (participacoesError) {
            console.error('Erro ao verificar participação:', participacoesError);
            toast({
              title: "Erro ao verificar participação",
              description: "Não foi possível verificar sua participação nas equipes. Tente novamente mais tarde.",
              variant: "destructive",
            });
            setEquipeAtual(null);
            return;
          }
          
          console.log('Participações encontradas:', participacoes);
          
          if (participacoes && participacoes.length > 0) {
            // Usuário participa de pelo menos uma equipe neste game
            const participacao = participacoes[0];
            
            // Obter detalhes da equipe
            const { data: equipeData, error: equipeError } = await supabase
              .from('game_equipes')
              .select('*')
              .eq('id', participacao.equipe_id)
              .single();
              
            if (equipeError || !equipeData) {
              console.error('Erro ao buscar detalhes da equipe:', equipeError);
              toast({
                title: "Erro ao carregar equipe",
                description: "Não foi possível carregar os detalhes da sua equipe. Tente novamente mais tarde.",
                variant: "destructive",
              });
              setEquipeAtual(null);
              return;
            }
            
            console.log('Detalhes da equipe encontrados:', equipeData);
            
            // Buscar detalhes dos integrantes da equipe ATIVOS
            const { data: integrantesData, error: integrantesError } = await supabase
              .from("equipe_integrantes")
              .select(`
                id,
                integrante_id,
                status,
                is_owner,
                user:profiles(
                  name
                )
              `)
              .eq("equipe_id", participacao.equipe_id)
              .order("created_at", { ascending: true });
            
            // Buscar nome do líder
            const { data: liderData } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", equipeData.lider_id)
              .single();

            // Contar total de integrantes ativos na equipe
            const { count: totalIntegrantes } = await supabase
              .from('equipe_integrantes')
              .select('id', { count: 'exact', head: true })
              .eq('equipe_id', participacao.equipe_id)
              .eq('status', 'ativo');
            
            // Contar todos os integrantes (ativos + pendentes)
            const { count: totalTodosIntegrantes } = await supabase
              .from('equipe_integrantes')
              .select('id', { count: 'exact', head: true })
              .eq('equipe_id', participacao.equipe_id);
            
            setEquipeAtual({
              id: participacao.equipe_id,
              nome: equipeData.nome,
              status: equipeData.status,
              participante: true,
              is_owner: participacao.is_owner,
              status_integrante: participacao.status,
              lider_nome: liderData?.name || "Líder desconhecido",
              integrantes: integrantesData || [],
              total_integrantes: totalTodosIntegrantes || 0
            });
            
            console.log('Equipe definida para o usuário:', equipeAtual);
          } else {
            console.log('Usuário não participa de nenhuma equipe neste game');
            setEquipeAtual(null);
          }
        } else {
          console.log('Nenhuma equipe encontrada para este game');
          setEquipeAtual(null);
        }
      }
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do game:", error);
      toast({
        title: "Erro ao carregar game",
        description: error.message || "Não foi possível carregar os detalhes deste game.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Função para carregar apenas os detalhes do game sem verificar equipe
  async function loadGameOnly() {
    if (!gameId) return;
    
    try {
      setLoading(true);
      // Buscar detalhes do game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .eq("status", "ativo")
        .single();

      if (gameError) {
        throw gameError;
      }

      if (!gameData) {
        router.push("/gamerun");
        return;
      }

      setGame(gameData);
      setEquipeAtual(null); // Garantir que equipeAtual seja null para usuários não logados
    } catch (error: any) {
      console.error("Erro ao buscar detalhes do game:", error);
      toast({
        title: "Erro ao carregar game",
        description: error.message || "Não foi possível carregar os detalhes deste game.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Data não definida";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  // Função para abrir o modal de criação de equipe
  function abrirModalCriarEquipe() {
    setModalCriarEquipeAberto(true);
  }

  // Função chamada após criação bem-sucedida da equipe
  function onEquipeCriada(equipe: { id: string; nome: string; status: string }) {
    setEquipeAtual({
      id: equipe.id,
      nome: equipe.nome,
      status: equipe.status,
      participante: true,
      is_owner: true,
      lider_nome: "Você", // O criador é o líder
      integrantes: [{
        id: "temp-id", // ID temporário que será atualizado no próximo carregamento
        integrante_id: userId || "",
        status: "ativo",
        is_owner: true,
        user: {
          name: "Você" // Nome temporário que será atualizado no próximo carregamento
        }
      }],
      total_integrantes: 1
    });
    
    // Recarregar dados para ter informações completas
    setTimeout(() => {
      fetchGameDetails();
    }, 1000);
  }

  // Função para retirar a solicitação de participação 
  const retirarSolicitacao = async () => {
    if (!equipeAtual?.id || !userId) return;
    
    try {
      setLoading(true);
      
      // Primeiro, buscar o perfil do usuário para obter o ID do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (profileError || !profileData) {
        throw new Error("Não foi possível verificar seu perfil");
      }
      
      const perfilId = profileData.id;
      
      // Deletar a solicitação de participação
      const { error } = await supabase
        .from('equipe_integrantes')
        .delete()
        .eq('equipe_id', equipeAtual.id)
        .eq('integrante_id', perfilId);
      
      if (error) throw error;
      
      // Atualizar o estado
      setEquipeAtual(null);
      
      toast({
        title: "Solicitação retirada",
        description: "Sua solicitação de participação foi retirada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao retirar solicitação:', error);
      toast({
        title: "Erro ao retirar solicitação",
        description: error.message || "Não foi possível retirar sua solicitação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função chamada quando uma participação é solicitada com sucesso
  const handleParticipacaoSolicitada = async () => {
    if (userId) {
      // Recarregar os detalhes do game, incluindo o status de inscrição
      await fetchGameDetails();
    }
  };

  // Função para sair da equipe (para integrantes ativos que não são líderes)
  const sairDaEquipe = async () => {
    if (!equipeAtual?.id || !userId) return;
    
    try {
      setLoading(true);
      
      // Primeiro, buscar o perfil do usuário para obter o ID do perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (profileError || !profileData) {
        throw new Error("Não foi possível verificar seu perfil");
      }
      
      const perfilId = profileData.id;
      
      // Verificar se o usuário é líder da equipe
      if (equipeAtual.is_owner) {
        throw new Error("O líder não pode simplesmente sair da equipe. Transfira a liderança primeiro ou exclua a equipe.");
      }
      
      // Deletar a participação do integrante
      const { error } = await supabase
        .from('equipe_integrantes')
        .delete()
        .eq('equipe_id', equipeAtual.id)
        .eq('integrante_id', perfilId);
      
      if (error) throw error;
      
      // Atualizar o estado
      setEquipeAtual(null);
      
      toast({
        title: "Você saiu da equipe",
        description: "Você não faz mais parte desta equipe.",
      });
    } catch (error: any) {
      console.error('Erro ao sair da equipe:', error);
      toast({
        title: "Erro ao sair da equipe",
        description: error.message || "Não foi possível sair da equipe. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-500">Carregando detalhes do game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">Game não encontrado</h3>
          <p className="text-gray-500 mt-2">O game que você procura não existe ou não está ativo.</p>
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
        onClick={() => router.push("/gamerun")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para lista de games
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Detalhes do Game */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{game.titulo}</CardTitle>
                  <CardDescription className="mt-2">{game.descricao_curta}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ativo
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {game.tipo || 'Online'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {game.imagem_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <SafeImage 
                    src={game.imagem_url} 
                    alt={game.titulo}
                    fill
                    className="object-cover"
                    fallbackHeight={256}
                    fallbackWidth={768}
                  />
                </div>
              )}
              
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium mb-2">Descrição</h3>
                <p className="text-gray-700 whitespace-pre-line">{game.descricao}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <span>
                    {game.quantidade_integrantes} {game.quantidade_integrantes === 1 ? 'integrante' : 'integrantes'} por equipe
                  </span>
                </div>
                
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span>{game.data_inicio ? formatDate(game.data_inicio) : 'Data não definida'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status da Inscrição */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status de Inscrição</CardTitle>
            </CardHeader>
            <CardContent>
              {equipeAtual ? (
                <div className="space-y-4">
                  {/* Caso do usuário com solicitação pendente */}
                  {equipeAtual.status_integrante === 'pendente' ? (
                    <div className="p-4 rounded-md bg-yellow-50 border border-yellow-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-yellow-800 flex items-center">
                          Equipe: {equipeAtual.nome} 
                        </h3>
                      </div>
                      
                      <div className="bg-yellow-100 p-3 rounded-md text-sm text-yellow-800 border border-yellow-200 mt-2 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                        <span>Sua solicitação está aguardando aprovação do líder.</span>
                      </div>
                      
                      {/* Lista de integrantes incluindo pendentes para usuário pendente */}
                      <div className="mt-3 border-t border-yellow-200 pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          Integrantes ({equipeAtual.total_integrantes})
                        </h4>
                        
                        <div className="space-y-2">
                          {/* Líder da equipe */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center w-full px-2 py-2 rounded-md hover:bg-yellow-100">
                              <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center text-green-700 mr-2">
                                {equipeAtual.lider_nome?.charAt(0)?.toUpperCase() || 'L'}
                              </div>
                              <span className="flex-1">{equipeAtual.lider_nome}</span>
                              <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-200">
                                Líder
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Integrantes ativos e você como pendente */}
                          {equipeAtual.integrantes && equipeAtual.integrantes
                            .filter(integrante => integrante.status === "ativo" && !integrante.is_owner)
                            .map(integrante => (
                            <div key={integrante.id} className="flex items-center text-sm">
                              <div className="w-full flex items-center px-2 py-2 rounded-md hover:bg-yellow-100">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-2">
                                  {integrante.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="flex-1">{integrante.user?.name || 'Usuário sem nome'}</span>
                                <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-200">
                                  Ativo
                                </Badge>
                              </div>
                            </div>
                          ))}
                          
                          {/* Você como solicitante pendente */}
                          <div className="flex items-center text-sm">
                            <div className="w-full flex items-center px-2 py-2 rounded-md hover:bg-yellow-100">
                              <div className="h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 mr-2">
                                {userId?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="flex-1">Você</span>
                              <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-200">
                                Pendente
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          variant="outline"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={retirarSolicitacao}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Retirar solicitação
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-md bg-green-50 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-green-800 flex items-center">
                          Equipe: {equipeAtual.nome} 
                        </h3>
                        <Badge className="ml-2 px-2" variant={
                          equipeAtual.status === 'ativa' ? 'default' : 
                          equipeAtual.status === 'pendente' ? 'outline' : 'destructive'
                        }>
                        </Badge>
                      </div>
                      
                      {equipeAtual.status === 'pendente' && (
                        <div className="bg-yellow-50 p-2 rounded-md text-sm text-yellow-800 border border-yellow-100 mt-2 mb-3 flex items-center">
                          <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span>Sua equipe está sendo analisada.</span>
                        </div>
                      )}
                      
                      {equipeAtual.status === 'ativa' && (
                        <div className="text-sm text-green-700 mb-3 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span>A participação da equipe foi aprovada.</span>
                        </div>
                      )}
                      
                      {equipeAtual.status === 'rejeitada' && (
                        <div className="bg-red-50 p-2 rounded-md text-sm text-red-800 border border-red-100 mt-2 mb-3 flex items-center">
                          <XCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span><span className="font-medium">Equipe rejeitada:</span> Entre em contato com a administração para mais informações.</span>
                        </div>
                      )}
                      
                      
                      {/* Lista de integrantes */}
                      <div className="mt-3 border-t border-green-200 pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          Integrantes ({equipeAtual.total_integrantes})
                        </h4>
                        <div className="space-y-2">
                          {/* Líder da equipe */}
                          <div className="flex items-center text-sm">
                            <div className="w-full flex items-center px-2 py-2 rounded-md hover:bg-green-100">
                              <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center text-green-700 mr-2">
                                {equipeAtual.lider_nome?.charAt(0)?.toUpperCase() || 'L'}
                              </div>
                              <span className="flex-1">{equipeAtual.lider_nome}</span>
                              <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-200">
                                Líder
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Lista de todos os integrantes, incluindo pendentes */}
                          {equipeAtual.integrantes && equipeAtual.integrantes
                            .filter(integrante => !integrante.is_owner) // Filtrar o líder da lista
                            .map(integrante => {
                              // Definir cores com base no status
                              const avatarClass = integrante.status === 'ativo' 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-yellow-100 text-yellow-700";
                                
                              const badgeClass = integrante.status === 'ativo'
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200";
                                
                              const badgeText = integrante.status === 'ativo' ? "Ativo" : "Pendente";
                              
                              return (
                                <div key={integrante.id} className="flex items-center text-sm">
                                  <div className="w-full flex items-center px-2 py-2 rounded-md hover:bg-green-100">
                                    <div className={`h-6 w-6 rounded-full ${avatarClass} flex items-center justify-center mr-2`}>
                                      {integrante.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="flex-1">{integrante.user?.name || 'Usuário sem nome'}</span>
                                    <Badge variant="outline" className={`ml-auto ${badgeClass}`}>
                                      {badgeText}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                      
                      {/* Botão Gerenciar Equipe - visível apenas para o líder */}
                      {equipeAtual.is_owner && (
                        <div className="mt-4">
                          <Button 
                            variant="default"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 flex items-center justify-center"
                            onClick={() => router.push(`/gamerun/equipe/${equipeAtual.id}`)}
                          >
                            <span className="flex items-center justify-center text-center text-base font-medium">
                              Gerenciar Equipe
                            </span>
                          </Button>
                        </div>
                      )}
                      
                      {/* Botão Sair da Equipe - visível apenas para integrantes ativos que não são líderes */}
                      {!equipeAtual.is_owner && equipeAtual.status_integrante === 'ativo' && (
                        <div className="mt-4">
                          <Button 
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 py-3 flex items-center justify-center"
                            onClick={sairDaEquipe}
                          >
                            <span className="flex items-center justify-center text-center text-base font-medium">
                              Sair da Equipe
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) :
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-4">
                    <h3 className="font-medium text-blue-800 mb-2">Participe deste game!</h3>
                    <p className="text-gray-700">
                      Crie uma equipe para participar deste game. 
                      Você será o líder da equipe e poderá convidar outros participantes.
                    </p>
                    <p className="text-gray-700">
                    Ou solicite participação em uma das equipes abaixo. 
                    </p>

                  </div>
                  
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 flex items-center justify-center"
                    onClick={abrirModalCriarEquipe}
                  >
                    <span className="flex items-center justify-center text-center text-base font-medium">
                      Criar Minha Equipe
                    </span>
                  </Button>
                </div>
              }
            </CardContent>
          </Card>
          
          {/* Exibir a lista de equipes independente se o usuário está inscrito ou não */}
          <div className="mt-6">
            <ListaEquipesInscritas 
              gameId={gameId} 
              onParticipacaoSolicitada={handleParticipacaoSolicitada}
              quantidadeMaximaIntegrantes={game?.quantidade_integrantes}
            />
          </div>
        </div>
      </div>
      
      {/* Modal para Criar Equipe */}
      <ModalCriarEquipe 
        isOpen={modalCriarEquipeAberto}
        onClose={() => setModalCriarEquipeAberto(false)}
        gameId={gameId}
        onSuccess={onEquipeCriada}
      />
    </div>
  );
} 