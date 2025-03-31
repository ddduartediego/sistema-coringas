'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTimeInput, parseInputToUTC } from "@/lib/utils/date";

// Material UI Icons
import SaveIcon from '@mui/icons-material/Save';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';

interface Game {
  id: string;
  nome: string;
  titulo?: string;
  descricao: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
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
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientSupabaseClient();
  
  // Configure React Hook Form com Zod validator
  const { control, handleSubmit, watch, formState: { errors, isDirty } } = useForm<QuestFormValues>({
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
  const watchVisivel = watch("visivel");
  const hasChanges = isDirty || pdfFile !== null;
  
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
  
  // Salvar quest
  const onSubmit = async (data: QuestFormValues) => {
    try {
      setIsLoading(true);
      
      // Preparar objeto com os dados da quest
      const questData: Partial<Quest> = {
        titulo: data.titulo,
        descricao: data.descricao || '',
        numero: data.numero ? parseInt(data.numero) : null,
        visivel: data.visivel,
        status: data.status,
        pontos: parseInt(data.pontos || '0'),
        data_inicio: data.data_inicio ? parseInputToUTC(data.data_inicio) : null,
        data_fim: data.data_fim ? parseInputToUTC(data.data_fim) : null,
      };
      
      // Upload do arquivo PDF se existir
      if (pdfFile) {
        const pdfUrl = await uploadPdfToStorage(pdfFile, quest.id);
        if (pdfUrl) {
          questData.arquivo_pdf = pdfUrl;
        }
      }
      
      // Atualizar dados da quest
      const { error } = await supabase
        .from('quests')
        .update(questData)
        .eq('id', quest.id);
      
      if (error) {
        throw new Error('Não foi possível atualizar a quest: ' + error.message);
      }
      
      toast({
        title: "Quest atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      
      // Atualizar a página
      router.refresh();
    } catch (error: any) {
      console.error('Erro ao salvar quest:', error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || 'Ocorreu um erro ao salvar a quest. Tente novamente mais tarde.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // PDF atual
  const currentPdf = quest.arquivo_pdf;
  const hasPdf = !!currentPdf;
  const currentPdfName = hasPdf ? currentPdf.split('/').pop() : '';
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Informações básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoOutlinedIcon fontSize="small" />
            Informações básicas
          </CardTitle>
          <CardDescription>Informações essenciais da quest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-3">
              <Label htmlFor="titulo" className="block mb-2 font-medium">
                Título <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="titulo"
                control={control}
                render={({ field }) => (
                  <Input
                    id="titulo"
                    placeholder="Nome da quest"
                    {...field}
                    className={errors.titulo ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.titulo && (
                <p className="mt-1 text-sm text-red-500">{errors.titulo.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="numero" className="block mb-2 font-medium">
                Número/Ordem
              </Label>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <Input
                    id="numero"
                    type="number"
                    placeholder="Ordem da quest"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="descricao" className="block mb-2 font-medium">
              Descrição
            </Label>
            <Controller
              name="descricao"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhes sobre a quest"
                  rows={4}
                  className="resize-none"
                  {...field}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Datas e status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AccessTimeIcon fontSize="small" />
            Período e status
          </CardTitle>
          <CardDescription>Período de disponibilidade e estado da quest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="data_inicio" className="block mb-2 font-medium">
                Data de início
              </Label>
              <Controller
                name="data_inicio"
                control={control}
                render={({ field }) => (
                  <Input
                    id="data_inicio"
                    type="datetime-local"
                    {...field}
                  />
                )}
              />
            </div>
            <div>
              <Label htmlFor="data_fim" className="block mb-2 font-medium">
                Data de encerramento
              </Label>
              <Controller
                name="data_fim"
                control={control}
                render={({ field }) => (
                  <Input
                    id="data_fim"
                    type="datetime-local"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="status" className="block mb-2 font-medium">
                Status
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select
                    id="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...field}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="ativo">Ativa</option>
                    <option value="inativo">Inativa</option>
                    <option value="finalizada">Finalizada</option>
                  </select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="pontos" className="block mb-2 font-medium">
                Pontos
              </Label>
              <Controller
                name="pontos"
                control={control}
                render={({ field }) => (
                  <Input
                    id="pontos"
                    type="number"
                    min="0"
                    {...field}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center space-x-2">
              <Controller
                name="visivel"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="visivel"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="visivel"
                className="font-medium flex items-center gap-1 cursor-pointer"
              >
                {watchVisivel ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                {watchVisivel ? "Visível para os participantes" : "Oculta dos participantes"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DescriptionIcon fontSize="small" />
            Documento PDF
          </CardTitle>
          <CardDescription>Anexe o documento com detalhes da quest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-grow">
                {hasPdf && !pdfFile ? (
                  <div>
                    <p className="text-sm text-gray-600">PDF atual:</p>
                    <a
                      href={currentPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <DescriptionIcon fontSize="small" />
                      {currentPdfName || 'Ver PDF'}
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {pdfFile ? `Arquivo selecionado: ${pdfFile.name}` : 'Nenhum PDF selecionado'}
                    </p>
                  </div>
                )}
                
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">Enviando: {uploadProgress}%</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap md:justify-end">
                <label
                  htmlFor="pdf-upload"
                  className="inline-flex items-center gap-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-md border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <FileUploadIcon fontSize="small" />
                  <span>{hasPdf ? 'Substituir PDF' : 'Enviar PDF'}</span>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                
                {hasPdf && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 py-2 px-4 bg-red-50 text-red-600 rounded-md border border-red-100 hover:bg-red-100 transition-colors"
                    onClick={() => console.log('Funcionalidade de remover PDF a ser implementada')}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                    <span>Remover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || (!hasChanges && !pdfFile)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md"
        >
          <SaveIcon fontSize="small" className="mr-1" />
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
} 