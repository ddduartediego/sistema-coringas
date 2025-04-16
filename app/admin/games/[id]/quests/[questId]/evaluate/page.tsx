import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import QuestEvaluationClient from "./_components/QuestEvaluationClient"; // Componente que criaremos depois
import { Database } from "@/lib/database.types";

// Tipos específicos para esta página (ajustar conforme necessário)
type QuestWithChave = Database['public']['Tables']['quests']['Row'] & {
  chave: string | null; // Garantir que chave está no tipo
};

type EquipeQuestWithTeamName = Database['public']['Tables']['equipe_quests']['Row'] & {
  game_equipes: { // Resultado do JOIN
    id: string;
    nome: string;
  } | null;
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function QuestEvaluationPage({
  params
}: {
  params: { id: string; questId: string }; // IDs são strings
}) {
  const { id: gameId, questId } = params;
  console.log(`[EvaluationPage] Carregando avaliação para Game: ${gameId}, Quest: ${questId}`);

  const supabase = await createServerSupabaseClient();

  // 1. Verificar autenticação e permissão (Admin)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('[EvaluationPage] Erro de sessão ou usuário não autenticado:', sessionError);
    return redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single();

  // Somente admins podem avaliar
  if (profileError || !profile || !profile.is_admin) {
     console.error('[EvaluationPage] Erro ao buscar perfil ou usuário não é admin:', profileError);
     // Redirecionar para página anterior ou mostrar erro
     return redirect(`/admin/games/${gameId}/quests`);
  }
  console.log('[EvaluationPage] Usuário admin autenticado.');

  try {
    // 2. Buscar dados da Quest (incluindo a 'chave')
    console.log('[EvaluationPage] Buscando dados da quest...');
    const { data: questData, error: questError } = await supabase
      .from('quests')
      .select('*, chave') // Seleciona todas as colunas E a chave
      .eq('id', questId)
      .eq('game_id', gameId)
      .single();

    if (questError || !questData) {
      console.error(`[EvaluationPage] Erro ao buscar quest ${questId}:`, questError);
      throw new Error(`Quest ${questId} não encontrada ou erro ao buscar.`);
    }
    const quest = questData as QuestWithChave; // Cast para tipo com chave
    console.log(`[EvaluationPage] Quest "${quest.titulo}" encontrada. Chave: ${quest.chave ? 'Presente' : 'Ausente'}`);


    // 3. Buscar respostas das equipes para esta quest
    console.log('[EvaluationPage] Buscando respostas das equipes...');
    const { data: teamResponsesData, error: responsesError } = await supabase
      .from('equipe_quests')
      .select(`
        *,
        game_equipes ( id, nome )
      `)
      .eq('quest_id', questId)
      .order('created_at', { ascending: true }); // Ordenar por data de criação ou resposta?

    if (responsesError) {
      console.error(`[EvaluationPage] Erro ao buscar respostas das equipes para quest ${questId}:`, responsesError);
      throw new Error('Erro ao buscar respostas das equipes.');
    }
    const teamResponses = teamResponsesData as EquipeQuestWithTeamName[];
    console.log(`[EvaluationPage] Encontradas ${teamResponses.length} respostas/status de equipes.`);

    // 4. Renderizar o componente cliente passando os dados
    return (
      <Suspense fallback={<div>Carregando dados de avaliação...</div>}>
        <div className="container mx-auto py-8">
          {/* Passar quest (com chave) e teamResponses para o Client Component */}
          <QuestEvaluationClient
             quest={quest}
             teamResponses={teamResponses}
             gameId={gameId} // Passar gameId se necessário para navegação
           />
        </div>
      </Suspense>
    );

  } catch (error: any) {
    console.error("[EvaluationPage] Erro geral ao carregar página:", error);
    // Renderizar uma mensagem de erro mais robusta
     return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Erro ao Carregar Avaliação</h1>
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h2 className="font-semibold text-lg mb-2">Ocorreu um Erro Inesperado</h2>
          <p>{error.message || "Não foi possível carregar os dados para avaliação. Tente novamente."}</p>
          <a href={`/admin/games/${gameId}/quests`} className="mt-4 inline-block text-sm font-medium text-red-700 hover:underline">
            Voltar para a lista de quests
          </a>
        </div>
      </div>
    );
  }
} 