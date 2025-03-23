'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Users, ArrowLeft, UserPlus, Clock } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLider, setIsLider] = useState(false);
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
        setIsLider(equipeData.lider_id === userId);
        
        // Buscar integrantes da equipe
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
        
        setIntegrantes(integrantesData || []);

        // Verificar se o usuário atual é integrante
        const isIntegrante = integrantesData?.some(i => i.integrante_id === userId);
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
                
                <div className="space-y-3">
                  {integrantes.length === 0 ? (
                    <p className="text-gray-500">Nenhum integrante encontrado.</p>
                  ) : (
                    integrantes.map((integrante) => (
                      <div 
                        key={integrante.id} 
                        className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{integrante.user?.name || 'Usuário sem nome'}</p>
                          <p className="text-sm text-gray-500">{integrante.user?.email || 'Email não disponível'}</p>
                        </div>
                        <div className="flex items-center">
                          {integrante.is_owner && (
                            <Badge className="mr-2 bg-blue-100 text-blue-700 border-blue-200">
                              Líder
                            </Badge>
                          )}
                          <Badge variant="outline" className={
                            integrante.status === 'ativo' ? 'bg-green-50 text-green-700 border-green-200' :
                            integrante.status === 'pendente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }>
                            {integrante.status === 'ativo' ? 'Ativo' :
                             integrante.status === 'pendente' ? 'Pendente' : 
                             'Inativo'}
                          </Badge>
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
                    onClick={() => router.push(`/gamerun/equipe/${equipe.id}/editar`)}
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
    </div>
  );
} 