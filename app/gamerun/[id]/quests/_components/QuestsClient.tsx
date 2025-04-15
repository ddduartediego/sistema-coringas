'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { 
  CalendarIcon, 
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  Flag, 
  BookOpen, 
  Bookmark, 
  CheckCircle,
  MoreHorizontal,
  Edit,
  EyeOff,
  X,
  CheckSquare,
  Trash2,
  RefreshCw,
  Award,
  Lock as LockIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Adicionar componentes para o menu dropdown
interface DropdownMenuProps {
  children: React.ReactNode;
  isOpen: boolean;
}

const DropdownMenu = ({ children, isOpen }: DropdownMenuProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute right-0 top-full mt-1 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const DropdownMenuItem = ({ children, onClick, className = "", icon }: DropdownMenuItemProps) => {
  return (
    <button
      type="button"
      className={`flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 ${className}`}
      onClick={onClick}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const router = useRouter();
  
  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
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
  
  // Toggle dropdown menu
  const toggleDropdown = (e: React.MouseEvent, questId: string) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === questId ? null : questId);
  };
  
  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return format(new Date(dataString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Calcular tempo restante até a data limite
  const calcularTempoRestante = (dataString: string | null) => {
    if (!dataString) return "Sem data definida";
    
    const dataLimite = new Date(dataString);
    const agora = new Date();
    
    if (agora > dataLimite) {
      return "Disponível agora";
    }
    
    const diffEmDias = Math.ceil((dataLimite.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffEmDias === 1) {
      return "Disponível amanhã";
    } else if (diffEmDias <= 30) {
      return `Disponível em ${diffEmDias} dias`;
    } else {
      return formatarData(dataString);
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
  
  // Função para atualizar as quests disponíveis
  const atualizarQuests = async () => {
    try {
      setIsRefreshing(true);
      router.refresh(); // Força o Next.js a revalidar os dados da página
    } catch (error) {
      console.error('Erro ao atualizar quests:', error);
    } finally {
      // Aguardar um momento antes de desativar o estado de atualização
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-lg bg-blue-50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quests do Game</h1>
            <p className="mt-1 text-gray-600">Equipe: {equipe.nome}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={atualizarQuests}
              disabled={isRefreshing}
              className={`flex items-center rounded-md border border-primary-600 bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 hover:border-primary-700 focus:outline-none transition-colors ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => router.push(`/gamerun/${gameId}`)}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar para o Game
            </button>
          </div>
        </div>
      </div>
      
      {questsVisiveis.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma quest disponível</h3>
          <p className="mt-1 text-gray-500">Não há quests disponíveis para visualização no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {questsVisiveis.map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition hover:shadow-lg"
            >
              {/* Número da Quest e Ações */}
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-md mr-2">
                    #{quest.numero || '?'}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{quest.titulo}</h3>
                </div>
                
                {/* Dropdown menu de ações */}
                <div className="relative z-30">
                  <button
                    onClick={(e) => toggleDropdown(e, quest.id)}
                    className="p-1.5 rounded-full hover:bg-gray-100 focus:outline-none"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  </button>
                  
                  <DropdownMenu isOpen={openDropdownId === quest.id}>
                    <div className="py-1 shadow-lg">
                      <div className="px-4 py-2 text-sm font-medium border-b border-gray-100 bg-gray-50">
                        Ações
                      </div>
                      
                      {isLider && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/gamerun/${gameId}/quests/${quest.id}/edit`)}
                            icon={<Edit className="h-4 w-4 text-gray-600" />}
                          >
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => console.log('Tornar oculta', quest.id)}
                            icon={<EyeOff className="h-4 w-4 text-gray-600" />}
                          >
                            Tornar oculta
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => console.log('Inativar', quest.id)}
                            icon={<X className="h-4 w-4 text-gray-600" />}
                          >
                            Inativar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => console.log('Finalizar', quest.id)}
                            icon={<CheckSquare className="h-4 w-4 text-blue-600" />}
                            className="border-b border-gray-100"
                          >
                            Finalizar
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => {
                          router.push(`/gamerun/${gameId}/quests/${quest.id}`);
                        }}
                        icon={<Bookmark className="h-4 w-4 text-primary-600" />}
                      >
                        Ver Detalhes
                      </DropdownMenuItem>
                      
                      {isLider && (
                        <DropdownMenuItem 
                          onClick={() => console.log('Excluir', quest.id)}
                          icon={<Trash2 className="h-4 w-4" />}
                          className="text-red-600 border-t border-gray-100"
                        >
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </div>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="px-4 flex flex-wrap gap-2 mb-3">
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
                  {quest.status === 'ativo' ? 'Ativa' : quest.status}
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                  {getQuestTypeIcon(quest.tipo)}
                  <span className="ml-1.5">{quest.tipo === 'regular' ? 'Regular' : quest.tipo || 'Regular'}</span>
                </span>
                {quest.visivel && (
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800">
                    Visível
                  </span>
                )}
              </div>
              
              {/* Conteúdo */}
              <div className="flex flex-1 flex-col px-4 pb-4">
                {quest.descricao && quest.descricao !== quest.titulo && (
                  <div className="prose prose-sm prose-primary mb-4 max-h-24 overflow-hidden">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: quest.descricao.length > 300 
                          ? quest.descricao.substring(0, 300) + '...' 
                          : quest.descricao 
                      }} 
                    />
                  </div>
                )}
                
                <div className="mt-auto space-y-3">
                  {/* Pontos ou Cadeado */}
                  <div className="flex items-center">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    <span>
                      Pontos: {quest.tipo === 'cadeado' ? (
                        <LockIcon className="h-3.5 w-3.5 inline-block align-middle text-gray-500 ml-1" />
                      ) : (
                        <span className="font-medium text-gray-700">{quest.pontos}</span>
                      )}
                    </span>
                  </div>
                  
                  {/* Data de Início */}
                  {quest.data_inicio && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="inline-flex items-center justify-center mr-2 h-5 w-5 rounded-full bg-blue-50">
                        <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
                      </span>
                      <span>Início: {formatarData(quest.data_inicio)}</span>
                    </div>
                  )}
                  
                  {/* Data Limite / Countdown */}
                  {quest.data_fim && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="inline-flex items-center justify-center mr-2 h-5 w-5 rounded-full bg-amber-50">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                      </span>
                      <span>Prazo: {calcularTempoRestante(quest.data_fim)}</span>
                    </div>
                  )}
                  
                  {/* Botão Ver Detalhes */}
                  <div className="flex pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/gamerun/${gameId}/quests/${quest.id}`)}
                      className="border-primary-300 text-primary-700 hover:bg-primary-50"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}