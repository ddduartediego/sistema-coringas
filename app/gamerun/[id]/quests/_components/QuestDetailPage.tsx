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
  Bookmark,
  FileText,
  Download,
  Lock as LockIcon,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  arquivo_pdf?: string | null;
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
  resposta?: string | null;
  data_resposta?: string | null;
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
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [respostaInput, setRespostaInput] = useState('');
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  
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
      case 'respondido':
        return 'Respondido';
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
      case 'respondido':
        return 'bg-orange-100 text-orange-800';
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
  
  // Função para enviar resposta
  const handleEnviarResposta = async () => {
    // Log IDs ANTES de usar, para garantir que não são undefined/null
    console.log(`[handleEnviarResposta] Verificando IDs - Equipe: ${equipe?.id}, Quest: ${quest?.id}`);

    if (!equipe || !quest || !equipe.id || !quest.id || !respostaInput.trim()) {
        console.error('[handleEnviarResposta] Condições de envio não atendidas:', { hasEquipe: !!equipe, hasQuest: !!quest, equipeId: equipe?.id, questId: quest?.id, hasResposta: !!respostaInput.trim() });
        toast({
            title: "Erro",
            description: "Não foi possível determinar a equipe ou a quest para enviar a resposta.",
            variant: "destructive",
        });
        return;
    }

    setEnviandoResposta(true);
    try {
      const updateData = {
        resposta: respostaInput.trim(),
        status: 'respondido', // Novo status
        data_resposta: new Date().toISOString(), // Data/hora atual
      };

      console.log('[handleEnviarResposta] Enviando atualização para equipe_quests:', updateData);
      console.log(`[handleEnviarResposta] Usando match com equipe_id: ${equipe.id}, quest_id: ${quest.id}`);

      // Executar o update e LOGAR o resultado (data e error)
      const { data: updateResultData, error: updateError } = await supabase
        .from('equipe_quests')
        .update(updateData)
        .match({ equipe_id: equipe.id, quest_id: quest.id })
        .select(); // Adicionar .select() para ver a linha atualizada (ou null se não encontrou/atualizou)

      // Log detalhado do resultado da operação UPDATE
      console.log('[handleEnviarResposta] Resultado da operação Supabase Update:', { updateResultData, updateError });

      if (updateError) {
        console.error('[handleEnviarResposta] Erro retornado pelo Supabase ao enviar resposta:', updateError);
        throw updateError; // Lança o erro para o catch block
      }

      // Verificar se alguma linha foi realmente atualizada
      // Se .select() retorna um array vazio ou null, a linha não foi encontrada pelo .match()
      if (!updateResultData || updateResultData.length === 0) {
          console.warn('[handleEnviarResposta] Supabase update não retornou dados. A linha pode não ter sido encontrada pelo .match().');
          toast({
            title: "Aviso",
            description: "A resposta foi processada, mas não foi possível confirmar a atualização no banco. Verifique o status da quest.",
            variant: "default",
          });
          // Ainda assim, fazemos refresh para buscar o estado real do banco
          router.refresh();
      } else {
          console.log('[handleEnviarResposta] Resposta atualizada com sucesso no banco:', updateResultData);
          toast({
            title: "Resposta enviada!",
            description: "Sua resposta foi registrada com sucesso.",
          });
          setRespostaInput(''); // Limpar input após sucesso
          router.refresh(); // Atualizar dados da página
      }

    } catch (error: any) {
      // O catch agora pegará erros lançados explicitamente
      console.error('[handleEnviarResposta] Falha no bloco try/catch ao enviar resposta:', error);
      toast({
        title: "Erro ao enviar resposta",
        description: error.message || "Não foi possível salvar sua resposta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setEnviandoResposta(false);
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
            <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 flex items-center">
              <AwardIcon className="h-3.5 w-3.5 mr-1.5" />
              {quest.tipo === 'cadeado' ? (
                <LockIcon className="h-3.5 w-3.5" />
              ) : (
                <span>{quest.pontos} {quest.pontos === 1 ? 'ponto' : 'pontos'}</span>
              )}
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
            
            {/* PDF */}
            {quest.arquivo_pdf && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Documento de Apoio</h3>
                <a 
                  href={quest.arquivo_pdf} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 underline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Visualizar PDF da Quest</span>
                </a>
              </div>
            )}
            
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

            {/* Seção de Resposta */}
            {equipe && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {questProgress?.status !== 'respondido' && questProgress?.status !== 'concluida' && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-xl">Sua Resposta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="resposta-input" className="sr-only">Resposta</Label>
                        <Input
                          id="resposta-input"
                          type="text"
                          placeholder="Digite sua resposta aqui..."
                          value={respostaInput}
                          onChange={(e) => setRespostaInput(e.target.value)}
                          disabled={enviandoResposta}
                          className="bg-white"
                        />
                      </div>
                      <Button 
                        onClick={handleEnviarResposta} 
                        disabled={enviandoResposta || !respostaInput.trim()}
                        className="w-full sm:w-auto"
                      >
                        {enviandoResposta ? (
                          <><Clock className="animate-spin h-4 w-4 mr-2" /> Enviando...</>
                        ) : (
                          <><Send className="h-4 w-4 mr-2" /> Enviar Resposta</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {questProgress?.status === 'respondido' && (
                   <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-xl text-green-800">Resposta Enviada</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor="resposta-enviada" className="block text-sm font-medium text-green-700 mb-1">Sua resposta:</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="resposta-enviada"
                            readOnly
                            type={mostrarResposta ? 'text' : 'password'}
                            value={questProgress.resposta || ''}
                            className="flex-1 bg-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setMostrarResposta(!mostrarResposta)}
                            aria-label={mostrarResposta ? "Ocultar resposta" : "Mostrar resposta"}
                            className="border-gray-300 bg-white"
                          >
                            {mostrarResposta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {questProgress.data_resposta && (
                        <p className="text-sm text-green-600">
                          Enviada em: {formatarData(questProgress.data_resposta)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 