'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ptBR } from "date-fns/locale";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatDateTimeInput, parseInputToUTC } from "@/lib/utils/date";

// Material UI Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import DateRangeIcon from '@mui/icons-material/DateRange';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

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

interface QuestEditFormProps {
  game: Game;
  quest: Quest;
}

// Zod schema para validação
const questSchema = z.object({
  titulo: z.string().min(1, { message: "O título é obrigatório" }),
  descricao: z.string().optional(),
  numero: z.string().optional(),
  visivel: z.boolean().default(false),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z.string(),
  pontos: z.string().default("0"),
  arquivo_pdf: z.string().nullable().optional(),
});

type QuestFormValues = z.infer<typeof questSchema>;

export default function QuestEditForm({ game, quest }: QuestEditFormProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();
  
  // Configure React Hook Form com Zod validator
  const { control, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<QuestFormValues>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      titulo: quest.titulo,
      descricao: quest.descricao,
      numero: quest.numero?.toString() || '',
      visivel: quest.visivel,
      data_inicio: quest.data_inicio ? formatDateTimeInput(quest.data_inicio) : '',
      data_fim: quest.data_fim ? formatDateTimeInput(quest.data_fim) : '',
      status: quest.status,
      pontos: quest.pontos?.toString() || '0',
      arquivo_pdf: quest.arquivo_pdf || null
    }
  });
  
  // Observar valores do formulário para cálculos de duração
  const watchDataInicio = watch("data_inicio");
  const watchDataFim = watch("data_fim");
  const watchStatus = watch("status");
  const watchVisivel = watch("visivel");
  
  // Atualizar hasChanges quando há mudanças no formulário ou arquivo PDF
  useState(() => {
    setHasChanges(isDirty || pdfFile !== null);
  });
  
  // Função para lidar com o upload do arquivo PDF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setHasChanges(true);
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
      
      // Verificar se o bucket existe
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('Erro ao listar buckets:', bucketsError);
        throw new Error('Não foi possível acessar o Storage do Supabase');
      }
      
      const questPdfsBucket = buckets.find((b: any) => b.name === 'quest-pdfs');
      
      if (!questPdfsBucket) {
        throw new Error('Bucket quest-pdfs não encontrado. Por favor, crie o bucket no Supabase Studio');
      }
      
      // Criar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${questId}_${Date.now()}.${fileExt}`;
      const filePath = `${game.id}/${fileName}`;
      
      // Simulação de progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('quest-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (error) {
        console.error('Erro detalhado do upload:', JSON.stringify(error));
        throw error;
      }
      
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
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };
  
  // Renderizar ícone de status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <WarningAmberIcon className="h-5 w-5 text-yellow-500" />;
      case 'ativo':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'inativo':
        return <VisibilityOffIcon className="h-5 w-5 text-gray-500" />;
      case 'finalizada':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };
  
  // Renderizar badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativa</Badge>;
      case 'inativo':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inativa</Badge>;
      case 'finalizada':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Finalizada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Calcular duração da quest
  const calcularDuracao = () => {
    if (!watchDataInicio || !watchDataFim) return "";
    
    try {
      const start = new Date(watchDataInicio);
      const end = new Date(watchDataFim);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffMs < 0) return "período inválido (data final é anterior à inicial)";
      
      let result = "";
      if (diffDays > 0) {
        result += `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
      }
      if (diffHours > 0) {
        result += `${result ? ' e ' : ''}${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      }
      if (!result) result = "menos de 1 hora";
      
      return result;
    } catch (e) {
      return "período indefinido";
    }
  };
  
  // Salvar quest
  const onSubmit = async (data: QuestFormValues) => {
    try {
      setIsLoading(true);
      
      // Preparar objeto com os dados da quest
      const questData: Partial<Quest> = {
        titulo: data.titulo,
        descricao: data.descricao || "",
        numero: data.numero ? parseInt(data.numero) : null,
        visivel: data.visivel,
        data_inicio: data.data_inicio ? parseInputToUTC(data.data_inicio) : null,
        data_fim: data.data_fim ? parseInputToUTC(data.data_fim) : null,
        status: data.status,
        pontos: data.pontos ? parseInt(data.pontos) : 0,
        arquivo_pdf: data.arquivo_pdf
      };
      
      // Fazer upload do PDF se houver um novo arquivo
      if (pdfFile) {
        const pdfUrl = await uploadPdfToStorage(pdfFile, quest.id);
        if (pdfUrl) {
          questData.arquivo_pdf = pdfUrl;
        }
      }
      
      // Atualizar a quest
      const { data: updatedQuest, error } = await supabase
        .from('quests')
        .update(questData)
        .eq('id', quest.id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Quest atualizada",
        description: `A quest "${updatedQuest.titulo}" foi atualizada com sucesso.`,
      });
      
      // Voltar para a página de quests
      router.push(`/admin/games/${game.id}/quests`);
      
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
  
  // Voltar para a página de quests
  const handleBack = () => {
    // Alertar sobre alterações não salvas
    if (hasChanges) {
      if (confirm("Você tem alterações não salvas. Deseja realmente sair?")) {
        router.push(`/admin/games/${game.id}/quests`);
      }
    } else {
      router.push(`/admin/games/${game.id}/quests`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="informacoes" className="flex items-center gap-2">
            <DescriptionIcon sx={{ fontSize: 18 }} />
            <span>Informações</span>
          </TabsTrigger>
          <TabsTrigger value="datas" className="flex items-center gap-2">
            <DateRangeIcon sx={{ fontSize: 18 }} />
            <span>Datas</span>
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <SettingsIcon sx={{ fontSize: 18 }} />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="informacoes">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais da quest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Número
                  </label>
                  <Controller
                    name="numero"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="Número da quest"
                        className="mt-1"
                      />
                    )}
                  />
                </div>
                
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Título*
                  </label>
                  <Controller
                    name="titulo"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Título da quest"
                        className={`mt-1 ${errors.titulo ? "border-red-500" : ""}`}
                      />
                    )}
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-500">{errors.titulo.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Descrição detalhada da quest"
                      rows={5}
                      className="mt-1"
                    />
                  )}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pontos
                </label>
                <Controller
                  name="pontos"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder="Pontos para esta quest"
                      className="mt-1"
                    />
                  )}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Pontos que serão concedidos às equipes ao concluírem esta quest
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="datas">
          <Card>
            <CardHeader>
              <CardTitle>Datas e Prazos</CardTitle>
              <CardDescription>Configure quando a quest estará disponível</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Início
                  </label>
                  <Controller
                    name="data_inicio"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="datetime-local"
                        className="mt-1"
                      />
                    )}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    A partir desta data a quest estará disponível
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Término
                  </label>
                  <Controller
                    name="data_fim"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="datetime-local"
                        className="mt-1"
                      />
                    )}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Após esta data a quest não aceitará mais submissões
                  </p>
                </div>
              </div>
              
              {watchDataInicio && watchDataFim && (
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <DateRangeIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Duração da quest</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Esta quest estará disponível por {calcularDuracao()}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="configuracoes">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Quest</CardTitle>
              <CardDescription>Configurações adicionais e material de apoio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="ativo">Ativa</SelectItem>
                            <SelectItem value="inativo">Inativa</SelectItem>
                            <SelectItem value="finalizada">Finalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <div className="shrink-0">
                      {renderStatusIcon(watchStatus)}
                    </div>
                  </div>
                  <div className="mt-2">
                    {renderStatusBadge(watchStatus)}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start space-x-2 mt-7">
                    <Controller
                      name="visivel"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id="visivel"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1 text-sm">
                            <label htmlFor="visivel" className="font-medium text-gray-700 cursor-pointer">
                              Tornar quest visível
                            </label>
                            <p className="text-gray-500">
                              {watchVisivel
                                ? "A quest está visível para as equipes participantes" 
                                : "A quest está oculta das equipes participantes"}
                            </p>
                          </div>
                          <div className="shrink-0 mt-1">
                            {watchVisivel ? (
                              <VisibilityIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <VisibilityOffIcon className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Arquivo PDF
                </label>
                <div className="mt-1 rounded-md border border-gray-300 bg-white p-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadFileIcon className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  
                  {pdfFile && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                      <PictureAsPdfIcon className="h-4 w-4" />
                      <span>Novo arquivo: {pdfFile.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setPdfFile(null)}
                        className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </Button>
                    </div>
                  )}
                  
                  <Controller
                    name="arquivo_pdf"
                    control={control}
                    render={({ field }) => (
                      <>
                        {!pdfFile && field.value && (
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <PictureAsPdfIcon className="h-4 w-4" />
                              <span>Arquivo atual</span>
                            </div>
                            <div className="flex space-x-2">
                              <a 
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-3 py-2 text-sm font-medium leading-4 text-primary-700 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                              >
                                Visualizar PDF
                              </a>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => field.onChange(null)}
                                className="text-red-500 border-red-300 hover:bg-red-50"
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  />
                  
                  {isUploading && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Enviando arquivo... {uploadProgress}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between border-t border-gray-200 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Voltar para Quests
        </Button>
        
        <Button
          type="submit"
          disabled={isLoading || isUploading || !hasChanges}
          className={`flex items-center gap-2 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <SaveIcon sx={{ fontSize: 18 }} />
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
} 