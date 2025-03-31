'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus as PlusIcon, 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  MoreHorizontal,
  Check, 
  X 
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDateTimeInput, parseInputToUTC, isBeforeNow } from '@/lib/utils/date';
import EditIcon from '@mui/icons-material/Edit';

interface Game {
  id: string;
  nome: string;
  descricao: string;
  data_inicio: string | null;
  data_fim: string | null;
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
  created_at: string;
  updated_at: string;
  numero: number | null;
  visivel: boolean;
  arquivo_pdf: string | null;
}

interface QuestsAdminClientProps {
  gameId: string;
  supabase: any;
  exibirAlerta: (mensagem: string, tipo: 'sucesso' | 'erro' | 'info') => void;
}

export default function QuestsAdminClient({ gameId, supabase, exibirAlerta }: QuestsAdminClientProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [questsList, setQuestsList] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedTabKey, setSelectedTabKey] = useState<string>("todas");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    numero: '',
    visivel: false,
    data_inicio: '',
    data_fim: '',
    status: 'pendente',
    arquivo_pdf: null as string | null
  });
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Carregar dados do game e quests
  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true);
      try {
        // Carregar dados do game
        const { data: gameData, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameId)
          .single();
          
        if (gameError) throw gameError;
        setGame(gameData);
        
        // Carregar todas as quests do game
        const { data: questsData, error: questsError } = await supabase
          .from('quests')
          .select('*')
          .eq('game_id', gameId)
          .order('numero', { ascending: true })
          .order('created_at', { ascending: true });
          
        if (questsError) throw questsError;
        setQuestsList(questsData || []);
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        exibirAlerta('Erro ao carregar dados: ' + error.message, 'erro');
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarDados();
  }, [gameId, supabase, exibirAlerta]);
  
  // Filtrar quests por status
  const pendentes = questsList.filter(q => q.status === 'pendente');
  const ativas = questsList.filter(q => q.status === 'ativo');
  const inativas = questsList.filter(q => q.status === 'inativo');
  const finalizadas = questsList.filter(q => q.status === 'finalizada');
  
  // Formatar data - substituído pela utilidade
  const formatarData = (dataString: string | null) => {
    return formatDate(dataString, "dd 'de' MMMM 'de' yyyy 'às' HH:mm");
  };
  
  // Formatar data para input - substituído pela utilidade
  const formatarDataInput = (dataString: string | null) => {
    return formatDateTimeInput(dataString);
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
  
  // Abrir modal para criar quest
  const handleOpenCreateModal = () => {
    setFormData({
      titulo: '',
      descricao: '',
      numero: '',
      visivel: false,
      data_inicio: '',
      data_fim: '',
      status: 'pendente',
      arquivo_pdf: null
    });
    setModalMode('create');
    setShowModal(true);
  };
  
  // Abrir modal para editar quest
  const handleOpenEditModal = (quest: Quest) => {
    setSelectedQuest(quest);
    setFormData({
      titulo: quest.titulo,
      descricao: quest.descricao,
      numero: quest.numero?.toString() || '',
      visivel: quest.visivel,
      data_inicio: quest.data_inicio ? formatarDataInput(quest.data_inicio) : '',
      data_fim: quest.data_fim ? formatarDataInput(quest.data_fim) : '',
      status: quest.status,
      arquivo_pdf: quest.arquivo_pdf
    });
    setModalMode('edit');
    setShowModal(true);
  };
  
  // Abrir modal de confirmação para excluir quest
  const handleOpenDeleteModal = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowDeleteModal(true);
  };
  
  // Alterar visibilidade da quest
  const toggleVisibility = async (quest: Quest) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('quests')
        .update({ visivel: !quest.visivel })
        .eq('id', quest.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar a lista local
      setQuestsList(prevQuests => 
        prevQuests.map(q => q.id === quest.id ? data as Quest : q)
      );
      
      toast({
        title: `Quest ${data.visivel ? 'visível' : 'oculta'}`,
        description: `A quest "${quest.titulo}" agora está ${data.visivel ? 'visível' : 'oculta'} para as equipes.`,
      });
    } catch (error: any) {
      console.error('Erro ao alterar visibilidade:', error);
      toast({
        title: "Erro ao alterar visibilidade",
        description: error.message || "Não foi possível alterar a visibilidade da quest.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Alterar status da quest
  const changeStatus = async (quest: Quest, newStatus: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('quests')
        .update({ status: newStatus })
        .eq('id', quest.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Atualizar a lista local
      setQuestsList(prevQuests => 
        prevQuests.map(q => q.id === quest.id ? data as Quest : q)
      );
      
      toast({
        title: "Status atualizado",
        description: `A quest "${quest.titulo}" agora está com status "${newStatus}".`,
      });
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro ao alterar status",
        description: error.message || "Não foi possível alterar o status da quest.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Salvar quest (criar ou editar)
  const handleSaveQuest = async () => {
    try {
      setIsLoading(true);
      
      // Validar campos
      if (!formData.titulo.trim()) {
        toast({
          title: "Erro ao salvar",
          description: "O título é obrigatório.",
          variant: "destructive",
        });
        return;
      }
      
      const questData: Partial<Quest> = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        numero: formData.numero ? parseInt(formData.numero) : null,
        visivel: formData.visivel,
        data_inicio: formData.data_inicio ? parseInputToUTC(formData.data_inicio) : null,
        data_fim: formData.data_fim ? parseInputToUTC(formData.data_fim) : null,
        status: formData.status,
        game_id: game?.id,
        arquivo_pdf: formData.arquivo_pdf
      };
      
      if (modalMode === 'create') {
        // Criar nova quest
        const { data: novaQuest, error: questError } = await supabase
          .from('quests')
          .insert(questData)
          .select()
          .single();
        
        if (questError) throw questError;
        
        // Buscar todas as equipes do game
        const { data: equipes, error: equipesError } = await supabase
          .from('game_equipes')
          .select('id')
          .eq('game_id', game?.id);
        
        if (equipesError) throw equipesError;
        
        if (equipes && equipes.length > 0) {
          // Criar entradas na tabela equipe_quests para cada equipe
          const equipeQuestsData = equipes.map((equipe: { id: string }) => ({
            equipe_id: equipe.id,
            quest_id: novaQuest.id,
            status: 'pendente'
          }));
          
          const { error: equipeQuestsError } = await supabase
            .from('equipe_quests')
            .insert(equipeQuestsData);
          
          if (equipeQuestsError) throw equipeQuestsError;
        }
        
        // Adicionar à lista local
        setQuestsList(prevQuests => [...prevQuests, novaQuest as Quest]);
        
        toast({
          title: "Quest criada",
          description: `A quest "${novaQuest.titulo}" foi criada com sucesso para ${equipes ? equipes.length : 0} equipes.`,
        });
      } else if (modalMode === 'edit' && selectedQuest) {
        // Editar quest existente
        const { data, error } = await supabase
          .from('quests')
          .update(questData)
          .eq('id', selectedQuest.id)
          .select()
          .single();
        
        if (error) throw error;
        
        // Atualizar na lista local
        setQuestsList(prevQuests => 
          prevQuests.map(q => q.id === selectedQuest.id ? data as Quest : q)
        );
        
        toast({
          title: "Quest atualizada",
          description: `A quest "${data.titulo}" foi atualizada com sucesso.`,
        });
      }
      
      // Fechar modal
      setShowModal(false);
    } catch (error: any) {
      console.error('Erro ao salvar quest:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a quest.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Excluir quest
  const handleDeleteQuest = async () => {
    if (!selectedQuest) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', selectedQuest.id);
      
      if (error) throw error;
      
      // Remover da lista local
      setQuestsList(prevQuests => 
        prevQuests.filter(q => q.id !== selectedQuest.id)
      );
      
      toast({
        title: "Quest excluída",
        description: `A quest "${selectedQuest.titulo}" foi excluída com sucesso.`,
      });
      
      // Fechar modal
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error('Erro ao excluir quest:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a quest.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Alterar a navegação de volta para o gamerun-admin em vez de admin/games
  const handleBackToGames = () => {
    router.push(`/gamerun-admin/${game?.id}`);
  };
  
  // Navegar para a página de edição da quest
  const handleEditQuestPage = (quest: Quest) => {
    router.push(`/gamerun-admin/${gameId}/quests/${quest.id}/edit` as any);
  };
  
  // Função para fazer upload do arquivo para o Storage do Supabase
  const uploadPdfToStorage = async (file: File, questId: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      // Verificar se o bucket existe
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('Erro ao listar buckets:', bucketsError);
        throw new Error('Não foi possível acessar o Storage do Supabase');
      }
      
      const questPdfsBucket = buckets.find((b: { name: string }) => b.name === 'quest-pdfs');
      
      if (!questPdfsBucket) {
        throw new Error('Bucket quest-pdfs não encontrado. Por favor, crie o bucket no Supabase Studio');
      }
      
      console.log('Bucket encontrado:', questPdfsBucket);
      
      // Verificar a sessão atual para garantir que o usuário está autenticado
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Você precisa estar autenticado para fazer upload de arquivos');
      }
      
      // Criar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${questId}_${Date.now()}.${fileExt}`;
      const filePath = `${game?.id}/${fileName}`;
      
      console.log('Tentando fazer upload para:', filePath, 'como usuário autenticado');
      
      // Upload do arquivo com retry
      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadResult = null;
      
      while (uploadAttempts < maxAttempts) {
        uploadAttempts++;
        
        try {
          const { data, error } = await supabase.storage
            .from('quest-pdfs')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (error) {
            console.error(`Tentativa ${uploadAttempts}/${maxAttempts} falhou:`, error);
            if (uploadAttempts === maxAttempts) throw error;
            // Esperar 1 segundo antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            uploadResult = data;
            break;
          }
        } catch (err) {
          console.error(`Exceção na tentativa ${uploadAttempts}/${maxAttempts}:`, err);
          if (uploadAttempts === maxAttempts) throw err;
        }
      }
      
      if (!uploadResult) {
        throw new Error('Todas as tentativas de upload falharam');
      }
      
      console.log('Upload bem-sucedido:', uploadResult);
      
      // Obter URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('quest-pdfs')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload do PDF:', error?.message || JSON.stringify(error));
      toast({
        title: "Erro ao fazer upload",
        description: error?.message || "Não foi possível enviar o arquivo PDF. Verifique as permissões do bucket.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quests do Game</h1>
          <p className="mt-1 text-gray-600">
            Game: {game?.nome} 
            <span className="mx-2">•</span>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              game?.status === 'ativo' ? 'bg-green-100 text-green-800' :
              game?.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
              game?.status === 'inativo' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {game?.status === 'pendente' ? 'Pendente' :
               game?.status === 'ativo' ? 'Ativo' :
               game?.status === 'inativo' ? 'Inativo' : 'Encerrado'}
            </span>
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleBackToGames}
            className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar para o Game
          </button>
          
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Nova Quest
          </button>
        </div>
      </div>
      
      {/* Tabs de status */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTabKey("todas")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTabKey === "todas"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Todas ({questsList.length})
          </button>
          <button
            onClick={() => setSelectedTabKey("pendentes")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTabKey === "pendentes"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Pendentes ({pendentes.length})
          </button>
          <button
            onClick={() => setSelectedTabKey("ativas")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTabKey === "ativas"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Ativas ({ativas.length})
          </button>
          <button
            onClick={() => setSelectedTabKey("inativas")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTabKey === "inativas"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Inativas ({inativas.length})
          </button>
          <button
            onClick={() => setSelectedTabKey("finalizadas")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTabKey === "finalizadas"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Finalizadas ({finalizadas.length})
          </button>
        </nav>
      </div>
      
      {/* Conteúdo das abas */}
      <div className="mt-6">
        {selectedTabKey === "todas" && renderQuestsList(questsList)}
        {selectedTabKey === "pendentes" && renderQuestsList(pendentes)}
        {selectedTabKey === "ativas" && renderQuestsList(ativas)}
        {selectedTabKey === "inativas" && renderQuestsList(inativas)}
        {selectedTabKey === "finalizadas" && renderQuestsList(finalizadas)}
      </div>
      
      {/* Modal para criar/editar quest */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30" onClick={() => !isLoading && setShowModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {modalMode === 'create' ? 'Nova Quest' : 'Editar Quest'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Número da quest"
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Título*
                  </label>
                  <input
                    type="text"
                    placeholder="Título da quest"
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Descrição da quest"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={5}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Data Início
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Data Fim
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="ativo">Ativa</option>
                      <option value="inativo">Inativa</option>
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="mt-6 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="visivel"
                        checked={formData.visivel}
                        onChange={(e) => setFormData({...formData, visivel: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="visivel" className="text-sm text-gray-700">
                        Tornar quest visível para as equipes
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuest}
                  disabled={isLoading}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
                >
                  {isLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmação para excluir quest */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30" onClick={() => !isLoading && setShowDeleteModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Confirmar exclusão
              </h2>
              
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir a quest "{selectedQuest?.titulo}"?
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteQuest}
                  disabled={isLoading}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none"
                >
                  {isLoading ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Função para renderizar a lista de quests
  function renderQuestsList(quests: Quest[]) {
    if (quests.length === 0) {
      return (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <PlusIcon className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma quest encontrada</h3>
          <p className="mt-1 text-gray-500">Clique no botão "Nova Quest" para criar a primeira.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nova Quest
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map(quest => (
          <div key={quest.id} className="bg-white overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                  {quest.numero && <span className="mr-1 text-gray-500">#{quest.numero}</span>}
                  {quest.titulo}
                </h3>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white shadow-lg border border-gray-200 z-50">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditQuestPage(quest)} className="cursor-pointer hover:bg-gray-100">
                      <EditIcon className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleVisibility(quest)} className="cursor-pointer hover:bg-gray-100">
                      {quest.visivel ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Tornar visível
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
                    {quest.status !== 'pendente' && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'pendente')} className="cursor-pointer hover:bg-gray-100">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2" />
                        Pendente
                      </DropdownMenuItem>
                    )}
                    {quest.status !== 'ativo' && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'ativo')} className="cursor-pointer hover:bg-gray-100">
                        <span className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                        Ativa
                      </DropdownMenuItem>
                    )}
                    {quest.status !== 'inativo' && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'inativo')} className="cursor-pointer hover:bg-gray-100">
                        <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                        Inativa
                      </DropdownMenuItem>
                    )}
                    {quest.status !== 'finalizada' && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'finalizada')} className="cursor-pointer hover:bg-gray-100">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                        Finalizada
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer hover:bg-gray-100" 
                      onClick={() => handleOpenDeleteModal(quest)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  quest.status === 'ativo' ? 'bg-green-100 text-green-800' :
                  quest.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                  quest.status === 'inativo' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {quest.status === 'pendente' ? 'Pendente' :
                   quest.status === 'ativo' ? 'Ativa' :
                   quest.status === 'inativo' ? 'Inativa' : 'Finalizada'}
                </span>
                
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  quest.visivel ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {quest.visivel ? (
                    <>
                      <Eye className="mr-1 h-3 w-3" /> Visível
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-1 h-3 w-3" /> Oculta
                    </>
                  )}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {quest.descricao}
              </p>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500">
                  {quest.data_inicio && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      <span>Início: {formatarData(quest.data_inicio)}</span>
                    </div>
                  )}
                  {quest.data_fim && (
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <span>Fim: {formatarData(quest.data_fim)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-3 text-right">
              <button
                onClick={() => handleEditQuestPage(quest)}
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none transition-colors"
              >
                <EditIcon className="mr-1.5 h-3.5 w-3.5" fontSize="small" />
                Editar Quest
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
} 