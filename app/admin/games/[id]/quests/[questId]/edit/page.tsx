import { notFound, redirect } from 'next/navigation';
import QuestEditForm from './_components/QuestEditForm';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Definição das interfaces com base nos dados retornados pelo Supabase
interface GameData {
  id: string;
  titulo: string;
  descricao: string;
  descricao_curta: string;
  quantidade_integrantes: number;
  data_inicio: string | null;
  data_fim: string | null;
  imagem_url: string | null;
  status: string;
  tipo: string | null;
  created_at: string | null;
  updated_at: string | null;
  nome?: string;
}

interface QuestData {
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
  arquivo_pdf: string | null;
}

// Interfaces esperadas pelos componentes
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

interface PageProps {
  params: Promise<{
    id: string;
    questId: string;
  }>;
}

export default async function QuestEditPage({ params }: PageProps) {
  try {
    // Aguardar a resolução do params
    const { id: gameId, questId } = await params;
    
    // Criar cliente Supabase Server com tratamento assíncrono de cookies
    const supabase = await createServerSupabaseClient();
    
    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return redirect("/auth/login");
    }
    
    // Verificar se o usuário existe
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return redirect("/auth/login");
    }
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (profileError || !profile) {
      return redirect("/auth/login");
    }
    
    // Verificar se usuário é admin
    if (!profile.is_admin) {
      return redirect("/dashboard");
    }
    
    // Carregar dados do game
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
      
    if (gameError || !gameData) {
      return notFound();
    }
    
    // Transformar o gameData para o formato Game esperado pelo componente
    const game: Game = {
      id: gameData.id,
      nome: (gameData as any).nome || gameData.titulo, // Cast para garantir acesso à propriedade
      descricao: gameData.descricao,
      data_inicio: gameData.data_inicio,
      data_fim: (gameData as any).data_fim || null, // Cast para garantir acesso à propriedade
      status: gameData.status
    };
    
    // Carregar dados da quest
    const { data: questData, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('game_id', gameId)
      .single();
      
    if (questError || !questData) {
      return notFound();
    }
    
    // Transformar o questData para o formato Quest esperado pelo componente
    const quest: Quest = {
      id: questData.id,
      game_id: questData.game_id,
      titulo: questData.titulo,
      descricao: questData.descricao,
      pontos: questData.pontos,
      status: questData.status,
      tipo: questData.tipo,
      data_inicio: questData.data_inicio,
      data_fim: questData.data_fim,
      created_at: questData.created_at || '',
      updated_at: questData.updated_at || '',
      numero: questData.numero,
      visivel: questData.visivel,
      arquivo_pdf: questData.arquivo_pdf
    };
    
    return (
      <div className="bg-white rounded-md shadow-sm p-6 mb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{quest.titulo || 'Nova Quest'}</h1>
            <div className="mt-2 flex items-center">
              <span className="text-gray-600 mr-2">Game: {game.nome}</span>
              <Badge
                className={`${
                  game.status === 'ativo' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                  game.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                  game.status === 'inativo' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                  'bg-red-100 text-red-800 hover:bg-red-100'
                }`}
              >
                {game.status === 'pendente' ? 'Pendente' :
                 game.status === 'ativo' ? 'Ativo' :
                 game.status === 'inativo' ? 'Inativo' : 'Encerrado'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarMonthIcon fontSize="small" className="mr-1" />
              Quest #{quest.numero || '?'}
            </div>
            <Badge
              className={`${
                quest.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                quest.status === 'ativo' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                quest.status === 'inativo' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' :
                quest.status === 'finalizada' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                'bg-gray-100 text-gray-800 hover:bg-gray-100'
              }`}
            >
              {quest.status === 'pendente' ? 'Pendente' :
               quest.status === 'ativo' ? 'Ativa' :
               quest.status === 'inativo' ? 'Inativa' :
               quest.status === 'finalizada' ? 'Finalizada' : quest.status}
            </Badge>
            {quest.visivel ? (
              <div className="flex items-center">
                <VisibilityIcon fontSize="small" className="text-green-600 mr-1" />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Visível
                </Badge>
              </div>
            ) : (
              <div className="flex items-center">
                <VisibilityOffIcon fontSize="small" className="text-gray-500 mr-1" />
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  Oculta
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        <QuestEditForm game={game} quest={quest} />
      </div>
    );
  } catch (error: any) {
    // Verificar se é um erro de redirecionamento e retornar nulo
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      return null;
    }
    
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <h1 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar quest</h1>
        <p className="text-red-600">{error.message || "Não foi possível carregar a quest. Tente novamente mais tarde."}</p>
      </div>
    );
  }
} 