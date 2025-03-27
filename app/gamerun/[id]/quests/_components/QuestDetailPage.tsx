'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  AwardIcon, 
  Flag,
  BookOpen,
  Bookmark
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Game {
  id: string;
  nome: string;
  descricao: string;
  status: string;
}

interface Quest {
  id: string;
  game_id: string;
  titulo: string;
  descricao: string;
  pontos: number;
  status: string;
  tipo: string;
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string | null;
  updated_at: string | null;
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

interface QuestProgress {
  equipe_id: string;
  quest_id: string;
  status: string;
  progresso?: number;
  data_conclusao?: string | null;
  pontos_obtidos?: number;
}

interface QuestDetailPageProps {
  quest: Quest;
  game: Game;
  equipe: Equipe | null;
  profileId: string;
  questProgress: QuestProgress | null;
}

export default function QuestDetailPage({
  quest,
  game,
  equipe,
  profileId,
  questProgress
}: QuestDetailPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Obter o status da quest para a equipe
  const getQuestStatus = () => {
    if (!equipe) return 'Sem equipe';
    if (!questProgress) return 'Pendente';
    
    switch (questProgress.status) {
      case 'concluida':
        return 'Concluída';
      case 'em_progresso':
        return 'Em Progresso';
      case 'pendente':
      default:
        return 'Pendente';
    }
  };
  
  // Obter cor do badge de status
  const getStatusBadgeColor = () => {
    if (!equipe) return 'bg-gray-100 text-gray-800';
    if (!questProgress) return 'bg-yellow-100 text-yellow-800';
    
    switch (questProgress.status) {
      case 'concluida':
        return 'bg-green-100 text-green-800';
      case 'em_progresso':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Obter ícone para o tipo de quest
  const getQuestTypeIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'desafio':
        return <Flag className="h-4 w-4" />;
      case 'bonus':
        return <BookOpen className="h-4 w-4" />;
      case 'regular':
      default:
        return <Bookmark className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {quest.numero && <span className="text-gray-500 mr-2">#{quest.numero}</span>}
            {quest.titulo}
          </h1>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
              {quest.pontos} pontos
            </Badge>
            
            <Badge variant="outline" className={getStatusBadgeColor()}>
              {getQuestStatus()}
            </Badge>
            
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
              {getQuestTypeIcon(quest.tipo)}
              <span className="ml-1">{quest.tipo || 'Regular'}</span>
            </Badge>
          </div>
        </div>
        
        <Button 
          onClick={() => router.push(`/gamerun/${game.id}/quests`)}
          variant="outline"
          className="mt-4 md:mt-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Quests
        </Button>
      </div>
      
      {/* Card principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {/* Datas */}
            <div className="flex flex-col sm:flex-row sm:justify-between mb-6 text-sm text-gray-500">
              {quest.data_inicio && (
                <div className="flex items-center mb-2 sm:mb-0">
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
            
            {/* Descrição */}
            <div className="prose prose-blue max-w-none mb-6">
              {quest.descricao ? (
                <div dangerouslySetInnerHTML={{ __html: quest.descricao }} />
              ) : (
                <p className="text-gray-500 italic">Sem descrição detalhada</p>
              )}
            </div>
            
            {/* Informações adicionais */}
            {equipe && questProgress?.status === 'concluida' && (
              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-800">Quest Concluída</h3>
                </div>
                {questProgress.pontos_obtidos !== undefined && (
                  <div className="mt-2 flex items-center">
                    <AwardIcon className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-green-800">
                      Sua equipe obteve {questProgress.pontos_obtidos} {questProgress.pontos_obtidos === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>
                )}
                {questProgress.data_conclusao && (
                  <div className="mt-1 text-sm text-green-700">
                    Concluída em: {formatarData(questProgress.data_conclusao)}
                  </div>
                )}
              </div>
            )}
            
            {equipe && questProgress?.status === 'em_progresso' && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800">Quest em Progresso</h3>
                </div>
                {questProgress.progresso !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${questProgress.progresso}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Progresso: {questProgress.progresso}%
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Sem equipe ou equipe não ativa */}
            {!equipe && (
              <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center">
                  <Flag className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="font-semibold text-yellow-800">Você não está em uma equipe ativa</h3>
                </div>
                <p className="mt-2 text-yellow-700">
                  Para participar desta quest, você precisa estar em uma equipe ativa neste game.
                </p>
                <Button 
                  onClick={() => router.push(`/gamerun/${game.id}`)}
                  variant="outline"
                  className="mt-4 bg-white"
                >
                  Ver detalhes do Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 