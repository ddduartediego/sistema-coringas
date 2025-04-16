import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";
import RankingClientComponent from "./_components/RankingClientComponent"; // Componente cliente a ser criado

// Tipos AJUSTADOS para refletir o select
type Game = Pick<Database['public']['Tables']['games']['Row'], 'id' | 'titulo'>; // <-- Usar 'titulo'

type GameEquipe = Pick<Database['public']['Tables']['game_equipes']['Row'], 'id' | 'nome'>; // Apenas id e nome

type EquipeQuest = Pick<
    Database['public']['Tables']['equipe_quests']['Row'], 
    'equipe_id' | 'status' | 'avaliacao' | 'pontos_obtidos' // Apenas colunas selecionadas
>; 

interface TeamRankingData {
  equipeId: string;
  equipeNome: string;
  totalPontos: number;
  questsConcluidas: number;
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function GameRankingPage({
  params
}: {
  params: { id: string };
}) {
  const { id: gameId } = params;
  console.log(`[RankingPage] Carregando ranking para Game: ${gameId}`);

  const supabase = await createServerSupabaseClient();

  // 1. Autenticação e Verificação de Admin
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return redirect("/auth/login");
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', session.user.id)
    .single();

  if (!profile || !profile.is_admin) {
    console.warn(`[RankingPage] Usuário não admin tentou acessar ranking do game ${gameId}`);
    // Redirecionar para uma página apropriada, talvez a lista de jogos admin
    return redirect("/admin/games"); 
  }
  console.log(`[RankingPage] Admin ${session.user.id} acessando ranking.`);

  try {
    // 2. Buscar Dados do Jogo
    console.log(`[RankingPage] Buscando dados do game ${gameId}...`);
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('id, titulo') // <-- Selecionar 'titulo'
      .eq('id', gameId)
      .single<Game>(); // Adicionar tipo genérico para conferência

    if (gameError || !gameData) {
      console.error(`[RankingPage] Erro ao buscar game ${gameId}:`, gameError);
      throw new Error(`Jogo ${gameId} não encontrado.`);
    }
    console.log(`[RankingPage] Jogo "${gameData.titulo}" encontrado.`); // <-- Usar 'titulo' no log

    // 3. Buscar todas as equipes deste jogo
    console.log(`[RankingPage] Buscando equipes do game ${gameId}...`);
    const { data: teamsData, error: teamsError } = await supabase
      .from('game_equipes')
      .select('id, nome')
      .eq('game_id', gameId)
      .returns<GameEquipe[]>(); // Usar .returns para tipar a resposta

    if (teamsError) {
      console.error(`[RankingPage] Erro ao buscar equipes do game ${gameId}:`, teamsError);
      throw new Error('Erro ao buscar equipes do jogo.');
    }
    const teams = teamsData || [];
    console.log(`[RankingPage] Encontradas ${teams.length} equipes para o jogo.`);

    if (teams.length === 0) {
       console.log(`[RankingPage] Jogo ${gameId} não tem equipes. Ranking vazio.`);
       // Pode renderizar o componente cliente com lista vazia ou mostrar mensagem aqui
       return (
           <Suspense fallback={<div>Carregando ranking...</div>}>
               <div className="container mx-auto py-8">
                   <RankingClientComponent game={gameData} rankingData={[]} />
               </div>
            </Suspense>
        );
    }

    // 4. Buscar IDs das Quests deste Jogo (para filtrar equipe_quests)
    const { data: gameQuestsData, error: questsError } = await supabase
        .from('quests')
        .select('id')
        .eq('game_id', gameId);

    if (questsError) {
        console.error(`[RankingPage] Erro ao buscar quests do game ${gameId}:`, questsError);
        throw new Error('Erro ao buscar quests do jogo.');
    }
    const gameQuestIds = gameQuestsData?.map(q => q.id) || [];

    // 5. Buscar todos os registros de equipe_quests relevantes de uma vez
    let allTeamQuests: EquipeQuest[] = [];
    if (gameQuestIds.length > 0) {
        console.log(`[RankingPage] Buscando registros de equipe_quests para ${gameQuestIds.length} quests...`);
        const { data: teamQuestsData, error: teamQuestsError } = await supabase
            .from('equipe_quests')
            .select('equipe_id, status, avaliacao, pontos_obtidos')
            .in('quest_id', gameQuestIds)
            .returns<EquipeQuest[]>(); // Usar .returns para tipar a resposta

        if (teamQuestsError) {
            console.error(`[RankingPage] Erro ao buscar equipe_quests:`, teamQuestsError);
            throw new Error('Erro ao buscar progresso das equipes.');
        }
        allTeamQuests = teamQuestsData || [];
        console.log(`[RankingPage] Encontrados ${allTeamQuests.length} registros de equipe_quests.`);
    }

    // 6. Calcular Pontos e Quests Concluídas para cada equipe
    console.log(`[RankingPage] Calculando ranking...`);
    const rankingData: TeamRankingData[] = teams.map(team => {
        const teamQuests = allTeamQuests.filter(tq => tq.equipe_id === team.id);
        
        let totalPontos = 0;
        let questsConcluidas = 0;

        teamQuests.forEach(tq => {
            // Considera pontos apenas se avaliada como 'certo'
            if (tq.avaliacao === 'certo') {
                totalPontos += tq.pontos_obtidos || 0;
                // Considera concluída se status for concluida E avaliada como certo
                if(tq.status === 'concluida') {
                    questsConcluidas++;
                }
            }
            // Você poderia adicionar lógica aqui se quisesse contar 'concluida' mesmo se 'errado',
            // mas baseado na descrição anterior, contamos apenas as corretas.
        });

        return {
            equipeId: team.id,
            equipeNome: team.nome,
            totalPontos: totalPontos,
            questsConcluidas: questsConcluidas,
        };
    });

    // 7. Ordenar o Ranking
    rankingData.sort((a, b) => {
        // Primeiro por pontos (descendente)
        if (b.totalPontos !== a.totalPontos) {
            return b.totalPontos - a.totalPontos;
        }
        // Depois por quests concluídas (descendente)
        return b.questsConcluidas - a.questsConcluidas;
        // Poderia adicionar nome da equipe como critério final de desempate
        // return a.equipeNome.localeCompare(b.equipeNome);
    });
    console.log(`[RankingPage] Ranking calculado e ordenado.`);

    // 8. Renderizar Componente Cliente com os Dados
    return (
      <Suspense fallback={<div>Carregando ranking...</div>}>
        <div className="container mx-auto py-8">
          <RankingClientComponent 
            game={gameData} // gameData agora tem 'id' e 'titulo'
            rankingData={rankingData} 
          />
        </div>
      </Suspense>
    );

  } catch (error: any) {
    console.error("[RankingPage] Erro geral ao carregar página:", error);
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Erro ao Carregar Ranking</h1>
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h2 className="font-semibold text-lg mb-2">Ocorreu um Erro Inesperado</h2>
          <p>{error.message || "Não foi possível carregar os dados para o ranking. Tente novamente."}</p>
        </div>
      </div>
    );
  }
} 