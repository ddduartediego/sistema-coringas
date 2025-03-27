'use client';

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Quest {
  id: string;
  titulo: string;
  descricao: string;
  pontos: number;
  status: string;
  tipo: string;
  data_inicio: string | null;
  data_fim: string | null;
}

interface QuestDetailCardProps {
  quest: Quest;
  renderFooter?: () => React.ReactNode;
}

export default function QuestDetailCard({ quest, renderFooter }: QuestDetailCardProps) {
  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{quest.titulo}</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {quest.pontos} pontos
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {quest.descricao}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
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
      
      {renderFooter && (
        <div>
          {renderFooter()}
        </div>
      )}
    </Card>
  );
} 