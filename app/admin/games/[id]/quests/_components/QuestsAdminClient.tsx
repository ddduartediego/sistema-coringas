'use client';

import { useState } from "react";
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
  X,
  FileText,
  Upload
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
  arquivo_pdf?: string | null;
}

interface QuestsAdminClientProps {
  game: Game;
  quests: Quest[];
}

export default function QuestsAdminClient({ game, quests }: QuestsAdminClientProps) {
  const [questsList, setQuestsList] = useState<Quest[]>(quests);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
    tipo: 'regular',
    arquivo_pdf: null as string | null
  });
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Filtrar quests por status
  const pendentes = questsList.filter(q => q.status === 'pendente');
  const ativas = questsList.filter(q => q.status === 'ativo');
  const inativas = questsList.filter(q => q.status === 'inativo');
  const finalizadas = questsList.filter(q => q.status === 'finalizada');
  
  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Formatar data para input
  const formatarDataInput = (dataString: string | null) => {
    if (!dataString) return "";
    return format(new Date(dataString), "yyyy-MM-dd'T'HH:mm");
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
      tipo: 'regular',
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
      tipo: quest.tipo || 'regular',
      arquivo_pdf: quest.arquivo_pdf || null
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
  
  // Resetar formulário
  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      numero: '',
      visivel: false,
      data_inicio: '',
      data_fim: '',
      status: 'pendente',
      tipo: 'regular',
      arquivo_pdf: null
    });
    setPdfFile(null);
    setUploadProgress(0);
  };
  
  // Função para lidar com o upload do arquivo PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos PDF.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Função para fazer upload do arquivo para o Storage do Supabase
  const uploadPdfToStorage = async (file: File, questId: string): Promise<string | null> => {
    try {
      setIsUploading(true);

      // Criar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${questId}_${Date.now()}.${fileExt}`;
      const filePath = `${game.id}/${fileName}`;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('quest-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('[uploadPdfToStorage] Erro detalhado do upload:', JSON.stringify(error, null, 2));
        console.error('[uploadPdfToStorage] Mensagem de erro:', error.message);
        throw error;
      }

      // Obter URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from('quest-pdfs')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error('[uploadPdfToStorage] Erro geral na função:', error?.message || JSON.stringify(error));
      toast({
        title: "Erro no Upload do PDF",
        description: error?.message || "Não foi possível enviar o arquivo PDF.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Modificar a função handleSaveQuest para incluir o upload do PDF
  const handleSaveQuest = async () => {
    let equipes: { id: string }[] = [];
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

      let pdfUrl = formData.arquivo_pdf;

      // Garantir que game_id é sempre uma string válida
      if (!game.id) {
        throw new Error("ID do game não está disponível");
      }

      const questData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        numero: formData.numero ? parseInt(formData.numero) : null,
        visivel: formData.visivel,
        data_inicio: formData.data_inicio || null,
        data_fim: formData.data_fim || null,
        status: formData.status,
        tipo: formData.tipo,
        game_id: game.id, // Aqui garantimos que game_id é uma string
        // arquivo_pdf será atualizado depois, se necessário
      };

      if (modalMode === 'create') {
        console.log('[handleSaveQuest - Create] Iniciando criação de quest.');
        console.log('[handleSaveQuest - Create] Dados iniciais (sem PDF):', questData);

        // 1. Criar nova quest
        const { data: novaQuest, error: questError } = await supabase
          .from('quests')
          .insert(questData)
          .select()
          .single();

        if (questError) {
          console.error('[handleSaveQuest - Create] Erro ao INSERIR quest:', questError);
          throw questError;
        }

        console.log('[handleSaveQuest - Create] Quest inserida com sucesso, ID:', novaQuest.id);

        // 2. Fazer upload do PDF APÓS criar a quest, se houver arquivo
        if (pdfFile) {
          console.log('[handleSaveQuest - Create] PDF selecionado. Iniciando upload para quest ID:', novaQuest.id);
          pdfUrl = await uploadPdfToStorage(pdfFile, novaQuest.id);
          console.log('[handleSaveQuest - Create] Resultado do uploadPdfToStorage:', pdfUrl);

          // 3. Se o upload foi bem-sucedido, ATUALIZAR a quest com a URL
          if (pdfUrl) {
            console.log('[handleSaveQuest - Create] Upload bem-sucedido. Tentando ATUALIZAR quest com URL:', pdfUrl);
            const { error: updateError } = await supabase
              .from('quests')
              .update({ arquivo_pdf: pdfUrl })
              .eq('id', novaQuest.id);

            if (updateError) {
              console.error('[handleSaveQuest - Create] Erro ao ATUALIZAR quest com URL do PDF:', updateError);
              toast({
                title: "Erro ao salvar PDF",
                description: `A quest foi criada, mas houve um erro ao salvar o arquivo PDF: ${updateError.message}`,
                variant: "destructive",
              });
              // Mesmo com erro no PDF, a quest foi criada, então atualizamos localmente sem o PDF
              novaQuest.arquivo_pdf = null; // Garante que o estado local reflete o DB
            } else {
              console.log('[handleSaveQuest - Create] Quest atualizada com sucesso com a URL do PDF.');
              novaQuest.arquivo_pdf = pdfUrl; // Atualiza o objeto local
            }
          } else {
             console.warn('[handleSaveQuest - Create] Upload do PDF falhou ou foi cancelado (pdfUrl é null).');
             toast({
               title: "Aviso sobre PDF",
               description: "A quest foi criada, mas o arquivo PDF não pôde ser salvo.",
               variant: "default",
             });
             novaQuest.arquivo_pdf = null; // Garante que o estado local reflete o DB
          }
        } else {
           console.log('[handleSaveQuest - Create] Nenhum PDF selecionado.');
           novaQuest.arquivo_pdf = null; // Garante que o estado local reflete o DB
        }

        // 4. Buscar equipes e criar entradas em equipe_quests (REINTRODUZIDO)
        console.log('[handleSaveQuest - Create] Buscando equipes do game ID:', game.id);
        const { data: equipesData, error: equipesError } = await supabase
          .from('game_equipes')
          .select('id')
          .eq('game_id', game.id);

        if (equipesError) {
            console.error('[handleSaveQuest - Create] Erro ao buscar equipes:', equipesError);
            // Considerar se deve lançar o erro ou apenas logar e continuar
            // throw equipesError;
        } else {
            equipes = equipesData || []; // Atribui a equipesData a 'equipes' no escopo superior
            console.log(`[handleSaveQuest - Create] Encontradas ${equipes.length} equipes.`);
            if (equipes.length > 0) {
                console.log('[handleSaveQuest - Create] Criando entradas em equipe_quests...');
                const equipeQuestsData = equipes.map(equipe => ({
                    equipe_id: equipe.id,
                    quest_id: novaQuest.id,
                    status: 'pendente'
                }));
                const { error: equipeQuestsError } = await supabase
                    .from('equipe_quests')
                    .insert(equipeQuestsData);

                if (equipeQuestsError) {
                    console.error('[handleSaveQuest - Create] Erro ao inserir em equipe_quests:', equipeQuestsError);
                    // Considerar notificar o usuário sobre essa falha específica
                    toast({
                        title: "Erro ao associar quest às equipes",
                        description: equipeQuestsError.message,
                        variant: "destructive",
                    });
                }
                 console.log('[handleSaveQuest - Create] Entradas em equipe_quests criadas.');
            }
        }

        // 5. Adicionar à lista local
        console.log('[handleSaveQuest - Create] Adicionando quest ao estado local:', novaQuest);
        setQuestsList(prevQuests => [...prevQuests, novaQuest as Quest]);

        toast({
          title: "Quest criada",
          description: `A quest "${novaQuest.titulo}" foi criada com sucesso para ${equipes.length} equipes.`, // Agora 'equipes' está definida
        });

      } else if (modalMode === 'edit' && selectedQuest) {
        console.log('[handleSaveQuest - Edit] Iniciando edição de quest ID:', selectedQuest.id);
        const questUpdateData = {
           ...questData,
        };

        console.log('[handleSaveQuest - Edit] Dados para update (sem PDF):', questUpdateData);
        // 1. Editar quest existente (sem a URL do PDF ainda)
        const { error: updateError } = await supabase
          .from('quests')
          .update(questUpdateData)
          .eq('id', selectedQuest.id);

        if (updateError) {
           console.error('[handleSaveQuest - Edit] Erro ao ATUALIZAR quest (dados principais):', updateError);
           throw updateError;
        }
        console.log('[handleSaveQuest - Edit] Dados principais da quest atualizados.');

        let finalQuestData = { ...selectedQuest, ...questUpdateData } as Quest;

        // 2. Fazer upload de novo PDF se houver
        if (pdfFile) {
            console.log('[handleSaveQuest - Edit] Novo PDF selecionado. Iniciando upload para quest ID:', selectedQuest.id);
            pdfUrl = await uploadPdfToStorage(pdfFile, selectedQuest.id);
            console.log('[handleSaveQuest - Edit] Resultado do uploadPdfToStorage:', pdfUrl);

            // 3. Se o upload funcionou, ATUALIZAR SOMENTE O CAMPO PDF
            if (pdfUrl) {
                console.log('[handleSaveQuest - Edit] Upload bem-sucedido. Tentando ATUALIZAR campo PDF...');
                const { error: pdfUpdateError } = await supabase
                    .from('quests')
                    .update({ arquivo_pdf: pdfUrl })
                    .eq('id', selectedQuest.id);

                if (pdfUpdateError) {
                    console.error('[handleSaveQuest - Edit] Erro ao ATUALIZAR quest com URL do PDF:', pdfUpdateError);
                    toast({
                        title: "Erro ao salvar PDF",
                        description: `A quest foi atualizada, mas houve um erro ao salvar o novo arquivo PDF: ${pdfUpdateError.message}`,
                        variant: "destructive",
                    });
                    finalQuestData.arquivo_pdf = selectedQuest.arquivo_pdf; // Mantém o PDF antigo no estado local
                } else {
                     console.log('[handleSaveQuest - Edit] Campo PDF atualizado com sucesso.');
                     finalQuestData.arquivo_pdf = pdfUrl; // Atualiza o objeto final com o novo PDF
                }
            } else {
                console.warn('[handleSaveQuest - Edit] Upload do novo PDF falhou ou foi cancelado.');
                 toast({
                     title: "Aviso sobre PDF",
                     description: "A quest foi atualizada, mas o novo arquivo PDF não pôde ser salvo.",
                     variant: "default",
                 });
                 finalQuestData.arquivo_pdf = selectedQuest.arquivo_pdf; // Mantém o PDF antigo no estado local
            }
        } else {
           // Se não houve novo upload, mantém o PDF existente (já está em finalQuestData via selectedQuest)
           console.log('[handleSaveQuest - Edit] Nenhum novo PDF selecionado.');
           finalQuestData.arquivo_pdf = selectedQuest.arquivo_pdf;
        }

        // 4. Atualizar a lista local
        console.log('[handleSaveQuest - Edit] Atualizando quest no estado local:', finalQuestData);
        setQuestsList(prevQuests =>
          prevQuests.map(q =>
            q.id === selectedQuest.id
              ? finalQuestData
              : q
          )
        );

        toast({
          title: "Quest atualizada",
          description: "Quest atualizada com sucesso!",
        });
      }

      // Fechar o modal e resetar o formulário
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro geral em handleSaveQuest:', error);
      toast({
        title: "Erro ao salvar Quest",
        description: error.message || "Ocorreu um erro inesperado.",
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
  
  // Navegar para a página de edição da quest
  const handleEditQuestPage = (questId: string) => {
    router.push(`/admin/games/${game.id}/quests/${questId}/edit` as any);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quests do Game</h1>
          <p className="mt-1 text-gray-600">
            Game: {game.nome} 
            <span className="mx-2">•</span>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              game.status === 'ativo' ? 'bg-green-100 text-green-800' :
              game.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
              game.status === 'inativo' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {game.status === 'pendente' ? 'Pendente' :
               game.status === 'ativo' ? 'Ativo' :
               game.status === 'inativo' ? 'Inativo' : 'Encerrado'}
            </span>
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/admin/games/${game.id}` as any)}
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
              {/* Cabeçalho */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {modalMode === 'create' ? 'Nova Quest' : 'Editar Quest'}
                </h2>
                
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  disabled={isLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
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
                  <Textarea
                    placeholder="Descrição da quest"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={8}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Descreva os detalhes e objetivos da quest.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Arquivo PDF (opcional)
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {pdfFile ? 'Alterar PDF' : 'Selecionar PDF'}
                    </label>
                    
                    {(pdfFile || formData.arquivo_pdf) && (
                      <div className="ml-3 text-sm text-gray-500 flex items-center">
                        <FileText className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="truncate max-w-xs">
                          {pdfFile ? pdfFile.name : formData.arquivo_pdf?.split('/').pop() || 'Arquivo PDF'}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setPdfFile(null);
                            setFormData({...formData, arquivo_pdf: null});
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Enviando: {uploadProgress}%</p>
                    </div>
                  )}
                  
                  <p className="mt-1 text-sm text-gray-500">
                    Adicione um documento PDF com informações complementares para esta quest.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                    Tipo da Quest
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="cadeado">Cadeado</option>
                  </select>
                   <p className="mt-1 text-sm text-gray-500">
                    'Regular' é visível normalmente. 'Cadeado' pode ter regras especiais de liberação.
                  </p>
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
                    <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditQuestPage(quest.id)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleVisibility(quest)}>
                      {quest.visivel ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Tornar oculta
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Tornar visível
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {quest.status === 'pendente' && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'ativo')}>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Ativar
                      </DropdownMenuItem>
                    )}
                    {quest.status === 'ativo' && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'inativo')}>
                        <X className="mr-2 h-4 w-4 text-gray-600" />
                        Inativar
                      </DropdownMenuItem>
                    )}
                    {(quest.status === 'ativo' || quest.status === 'inativo') && (
                      <DropdownMenuItem onClick={() => changeStatus(quest, 'finalizada')}>
                        <Check className="mr-2 h-4 w-4 text-blue-600" />
                        Finalizar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {quest.arquivo_pdf && (
                      <DropdownMenuItem onClick={() => window.open(quest.arquivo_pdf!, '_blank')}>
                        <FileText className="mr-2 h-4 w-4 text-blue-600" />
                        Ver PDF
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleOpenDeleteModal(quest)}
                      className="text-red-600 focus:text-red-700"
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
              
              <div className="mt-2">
                {quest.descricao ? (
                  <div 
                    className="prose prose-sm max-h-32 overflow-hidden text-ellipsis" 
                    dangerouslySetInnerHTML={{ __html: quest.descricao.substring(0, 150) + (quest.descricao.length > 150 ? '...' : '') }}
                  />
                ) : (
                  <p className="text-gray-500 text-sm italic">Sem descrição</p>
                )}
              </div>
              
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
                onClick={() => handleEditQuestPage(quest.id)}
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