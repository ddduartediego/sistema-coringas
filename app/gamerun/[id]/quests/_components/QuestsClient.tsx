'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, ArrowLeft, AlertCircle } from "lucide-react";

interface Quest {
  id: string;
  titulo: string;
  descricao: string;
  pontos: number;
  status: string;
  tipo: string;
  data_inicio: string | null;
  data_fim: string | null;
  numero: number | null;
  visivel: boolean;
}

interface Equipe {
  id: string;
  nome: string;
  status: string;
  game_id: string;
  lider_id: string;
}

interface QuestsClientProps {
  gameId: string;
  equipe: Equipe;
  quests: Quest[];
  profileId: string;
}

export default function QuestsClient({ 
  gameId, 
  equipe, 
  quests, 
  profileId 
}: QuestsClientProps) {
  const [questsVisiveis, setQuestsVisiveis] = useState<Quest[]>([]);
  const [isLider, setIsLider] = useState<boolean>(false);
  
  const router = useRouter();
  
  // Inicializar os dados
  useEffect(() => {
    // Verificar se o usuário é líder da equipe
    if (equipe.lider_id === profileId) {
      setIsLider(true);
    }
    
    // Filtrar apenas quests visíveis e com status ativo
    const visiveis = quests.filter(q => q.visivel && q.status === 'ativo');
    // Ordenar por número
    visiveis.sort((a, b) => {
      const numA = a.numero || 0;
      const numB = b.numero || 0;
      return numA - numB;
    });
    
    setQuestsVisiveis(visiveis);
  }, [quests, equipe, profileId]);
  
  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Renderizar status da quest
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case "ativo":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativa</Badge>;
      case "inativo":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inativa</Badge>;
      case "finalizada":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Finalizada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Missões do Game</h1>
          <p className="text-gray-500">Equipe: {equipe.nome}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/gamerun/${gameId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Game
        </Button>
      </div>
      
      {questsVisiveis.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">Nenhuma missão disponível</h3>
          <p className="text-gray-500 mt-2">
            Não há missões disponíveis para visualização no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questsVisiveis.map(quest => (
            <Card key={quest.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {quest.numero && <span className="mr-2">#{quest.numero}</span>}
                    {quest.titulo}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(quest.status)}
                    {quest.pontos > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {quest.pontos} pontos
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {quest.descricao}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-col space-y-1.5 text-sm text-gray-500">
                  {quest.data_inicio && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>Disponível desde: {formatarData(quest.data_inicio)}</span>
                    </div>
                  )}
                  {quest.data_fim && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Disponível até: {formatarData(quest.data_fim)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 