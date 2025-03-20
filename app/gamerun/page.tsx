"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";

interface Game {
  id: string;
  titulo: string;
  descricao_curta: string;
  descricao: string;
  quantidade_integrantes: number;
  data_inicio: string | null;
  imagem_url: string | null;
  status: string;
}

export default function GameRunPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchGames() {
      try {
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
        toast({
          title: "Erro ao carregar games",
          description: error.message || "Ocorreu um erro ao buscar os games disponíveis.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [toast]);

  function formatDate(dateString: string | null) {
    if (!dateString) return "Data não definida";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">GameRun - Jogos Disponíveis</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-xl text-gray-500">Carregando games...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">Nenhum game disponível no momento</h3>
          <p className="text-gray-500 mt-2">Fique atento! Novos games serão anunciados em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="overflow-hidden flex flex-col h-full border-2 hover:border-primary transition-all">
              <div className="relative h-48 bg-gray-100">
                {game.imagem_url ? (
                  <Image
                    src={game.imagem_url}
                    alt={game.titulo}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <p className="text-gray-500">Sem imagem</p>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{game.titulo}</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ativo
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{game.descricao_curta}</CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="flex items-center mb-2 text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm">{formatDate(game.data_inicio)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-sm">{game.quantidade_integrantes} integrantes por equipe</span>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Link href={`/gamerun/${game.id}`} className="w-full">
                  <Button variant="default" className="w-full">
                    Ver Detalhes
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 