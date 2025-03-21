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
import { CalendarIcon, Users, ArrowLeft, UserPlus, Clock } from "lucide-react";
import SafeImage from "@/components/ui/safe-image";

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

interface EquipeAtual {
  id: string;
  nome: string;
  status: string;
  participante: boolean;
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
  const [inscrevendo, setInscrevendo] = useState(false);
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
    if (!gameId) return;

    async function fetchGameDetails() {
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
          const { data: equipeData, error: equipeError } = await supabase
            .from("equipe_integrantes")
            .select(`
              equipe_id,
              game_equipes:game_equipes!inner(
                id,
                nome,
                status,
                game_id
              )
            `)
            .eq("integrante_id", userId)
            .eq("game_equipes.game_id", gameId)
            .single();

          if (equipeData && !equipeError) {
            const typedGameEquipes = equipeData.game_equipes as any;
            setEquipeAtual({
              id: equipeData.equipe_id,
              nome: typedGameEquipes.nome,
              status: typedGameEquipes.status,
              participante: true
            });
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

    fetchGameDetails();
  }, [gameId, userId, router, toast]);

  function formatDate(dateString: string | null) {
    if (!dateString) return "Data não definida";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  async function inscreverEquipe() {
    if (!userId || !game) return;

    try {
      setInscrevendo(true);
      
      // Verificar se o usuário já está inscrito em outra equipe neste game
      const { data: existingTeam } = await supabase
        .from("equipe_integrantes")
        .select(`
          equipe_id,
          game_equipes!inner(
            id,
            game_id
          )
        `)
        .eq("integrante_id", userId)
        .eq("game_equipes.game_id", game.id)
        .single();

      if (existingTeam) {
        toast({
          title: "Já inscrito",
          description: "Você já está inscrito em uma equipe para este game.",
          variant: "destructive",
        });
        return;
      }

      // Criar nova equipe
      const { data: novaEquipe, error: equipeError } = await supabase
        .from("game_equipes")
        .insert({
          game_id: game.id,
          nome: `Equipe de ${userId.substring(0, 8)}`, // Nome temporário
          status: "pendente",
          lider_id: userId
        })
        .select()
        .single();

      if (equipeError) throw equipeError;

      // Adicionar o usuário como integrante (líder) da equipe
      const { error: integranteError } = await supabase
        .from("equipe_integrantes")
        .insert({
          equipe_id: novaEquipe.id,
          integrante_id: userId,
          status: "ativo" // Já aprovado por ser o líder
        });

      if (integranteError) throw integranteError;

      setEquipeAtual({
        id: novaEquipe.id,
        nome: novaEquipe.nome,
        status: novaEquipe.status,
        participante: true
      });

      toast({
        title: "Equipe criada com sucesso!",
        description: "Sua equipe foi registrada e está aguardando aprovação.",
      });

    } catch (error: any) {
      console.error("Erro ao inscrever equipe:", error);
      toast({
        title: "Erro ao criar equipe",
        description: error.message || "Ocorreu um erro ao tentar criar sua equipe.",
        variant: "destructive",
      });
    } finally {
      setInscrevendo(false);
    }
  }

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
              <CardDescription>
                {equipeAtual 
                  ? 'Você está inscrito neste game' 
                  : 'Inscreva-se para participar deste game'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {equipeAtual ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="font-medium">Equipe: {equipeAtual.nome}</p>
                    <Badge className="mt-2" variant={
                      equipeAtual.status === 'ativa' ? 'default' : 
                      equipeAtual.status === 'pendente' ? 'outline' : 'destructive'
                    }>
                      {equipeAtual.status === 'ativa' ? 'Aprovada' : 
                       equipeAtual.status === 'pendente' ? 'Aguardando aprovação' : 'Rejeitada'}
                    </Badge>
                  </div>
                  
                  <Button 
                    variant="secondary"
                    className="w-full"
                    onClick={() => router.push(`/gamerun/equipe/${equipeAtual.id}`)}
                  >
                    Gerenciar Equipe
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Crie uma equipe para participar deste game. 
                    Você será o líder da equipe e poderá convidar outros participantes.
                  </p>
                  
                  <Button 
                    className="w-full"
                    onClick={inscreverEquipe}
                    disabled={inscrevendo}
                  >
                    {inscrevendo ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Inscrevendo...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Equipe
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 