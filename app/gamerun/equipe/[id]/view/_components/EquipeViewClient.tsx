'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Users, ArrowLeft, User, Clock, Trophy } from "lucide-react";
import SafeImage from "@/components/ui/safe-image";

interface Equipe {
  id: string;
  nome: string;
  status: string;
  lider_id: string;
  game_id: string;
  game: {
    id: string;
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
  user: {
    name: string;
  } | null;
}

interface EquipeViewClientProps {
  equipeId: string;
}

export default function EquipeViewClient({ equipeId }: EquipeViewClientProps) {
  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
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
    if (!equipeId) return;

    async function fetchEquipeDetails() {
      try {
        setLoading(true);
        
        // Buscar detalhes da equipe
        const { data: equipeData, error: equipeError } = await supabase
          .from("game_equipes")
          .select(`
            *,
            game:games(
              id,
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
          toast({
            title: "Equipe não encontrada",
            description: "A equipe que você está procurando não existe ou foi removida.",
            variant: "destructive",
          });
          router.push("/gamerun");
          return;
        }

        setEquipe(equipeData);
        
        // Buscar integrantes da equipe
        const { data: integrantesData, error: integrantesError } = await supabase
          .from("equipe_integrantes")
          .select(`
            id,
            equipe_id,
            integrante_id,
            status,
            is_owner,
            user:profiles(
              name
            )
          `)
          .eq("equipe_id", equipeId)
          .eq("status", "ativo")
          .order("created_at", { ascending: true });
          
        if (integrantesError) throw integrantesError;
        
        setIntegrantes(integrantesData || []);
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
  }, [equipeId, router, toast]);

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
          <p className="text-gray-500 mt-2">A equipe que você procura não existe ou não está ativa.</p>
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
        {/* Informações da Equipe */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center">
                    {equipe.nome}
                    {equipe.status === 'ativa' && (
                      <Trophy className="ml-2 h-5 w-5 text-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Equipe participante do game <span className="font-medium">{equipe.game.titulo}</span>
                  </CardDescription>
                </div>
                <Badge variant="outline" className={
                  equipe.status === 'ativa' ? 'bg-green-50 text-green-700 border-green-200' :
                  equipe.status === 'pendente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }>
                  {equipe.status === 'ativa' ? 'Ativa' : 
                   equipe.status === 'pendente' ? 'Pendente' : 'Inativa'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Informações do Game */}
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">Sobre o Game</h3>
                <p className="text-gray-700 mb-3">{equipe.game.descricao_curta}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/gamerun/${equipe.game.id}`)}
                >
                  Ver detalhes do game
                </Button>
              </div>
              
              {/* Lista de Integrantes */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-gray-500" />
                  Integrantes
                  <span className="ml-2 text-sm text-gray-500">
                    ({integrantes.length} de {equipe.game.quantidade_integrantes})
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {integrantes.length === 0 ? (
                    <p className="text-gray-500 col-span-2">Nenhum integrante ativo na equipe.</p>
                  ) : (
                    integrantes.map((integrante) => (
                      <div 
                        key={integrante.id} 
                        className="flex items-center p-3 border rounded-md bg-gray-50"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mr-3 flex-shrink-0">
                          {integrante.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{integrante.user?.name || 'Usuário sem nome'}</p>
                          {integrante.is_owner && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Líder
                            </Badge>
                          )}
                          {integrante.status === 'pendente' && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 ml-2">
                              Pendente
                            </Badge>
                          )}
                          {integrante.status === 'ativo' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 ml-2">
                              Ativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Status da Equipe */}
              {equipe.status === 'pendente' && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 flex items-start">
                  <Clock className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Equipe em aprovação</h4>
                    <p className="text-sm text-yellow-700">
                      Esta equipe está aguardando aprovação do administrador para participar oficialmente do game.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações do usuário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Interações com esta equipe
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {!userId && (
                <div className="text-center p-4 border rounded-md bg-blue-50">
                  <p className="text-sm text-blue-700">
                    Faça login para participar ou criar sua própria equipe.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 