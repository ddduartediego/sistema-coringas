import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import QuestEditForm from "./_components/QuestEditForm";

// Interface para as propriedades da página
interface PageProps {
  params: Promise<{
    id: string;
    questId: string;
  }>;
}

// Interface Game que corresponde ao esperado pelo QuestEditForm
interface Game {
  id: string;
  nome: string;
  descricao: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
}

export default async function QuestEditPage({ params }: PageProps) {
  try {
    // Aguardar a resolução do params
    const { id, questId } = await params;
    
    const supabase = await createServerSupabaseClient();
    
    // Verificar se o usuário está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
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
      .eq('id', id)
      .single();
      
    if (gameError || !gameData) {
      return notFound();
    }
    
    // Carregar dados da quest
    const { data: quest, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('game_id', id)
      .single();
      
    if (questError || !quest) {
      return notFound();
    }
    
    // Adaptar os dados do game para a interface esperada
    const game: Game = {
      id: gameData.id,
      nome: (gameData as any).nome || gameData.titulo || "Game sem nome",
      descricao: gameData.descricao || "",
      data_inicio: gameData.data_inicio,
      data_fim: (gameData as any).data_fim || null,
      status: gameData.status
    };
    
    // Renderizar o status da quest
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
    
    // Obter o nome do game (pode estar em 'nome' ou 'titulo' dependendo da estrutura do banco)
    const gameName = game.nome;
    
    return (
      <>
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">{quest.titulo}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              <span className="font-medium">Game:</span>
              <span className="ml-1">{gameName}</span>
            </div>
            {renderStatusBadge(quest.status)}
            {quest.visivel ? (
              <Badge className="bg-green-50 text-green-700 border-green-100">
                Visível
              </Badge>
            ) : (
              <Badge className="bg-gray-50 text-gray-600 border-gray-200">
                Oculta
              </Badge>
            )}
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <QuestEditForm game={game} quest={quest} />
        </div>
      </>
    );
  } catch (error: any) {
    // Verificar se é um erro de redirecionamento e retornar nulo
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      return null;
    }
    
    return (
      <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
        <h1 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar quest</h1>
        <p className="text-red-600">{error.message || "Não foi possível carregar a quest. Tente novamente mais tarde."}</p>
      </div>
    );
  }
} 