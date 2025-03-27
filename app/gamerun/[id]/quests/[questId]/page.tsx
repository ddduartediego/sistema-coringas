import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import QuestDetailPage from "../_components/QuestDetailPage";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function QuestDetailViewPage({
  params
}: {
  params: Promise<{ id: string; questId: string }>;
}) {
  // Aguardar a resolução do params
  console.log("QuestDetailViewPage: Iniciando função");
  const { id, questId } = await params;
  const gameId = id;
  console.log("QuestDetailViewPage: ID do jogo obtido:", gameId);
  console.log("QuestDetailViewPage: ID da quest obtido:", questId);
  
  try {
    // Criar cliente Supabase Server
    console.log("QuestDetailViewPage: Criando cliente Supabase");
    const supabase = await createServerSupabaseClient();
    console.log("QuestDetailViewPage: Cliente Supabase criado");
    
    // Verificar autenticação
    console.log("QuestDetailViewPage: Verificando autenticação");
    const { data: { session } } = await supabase.auth.getSession();
    console.log("QuestDetailViewPage: Sessão obtida:", session ? "Existe" : "Não existe");
    
    if (!session) {
      console.log("QuestDetailViewPage: Usuário não autenticado. Redirecionando para login.");
      return redirect("/auth/login");
    }
    
    // Buscar perfil do usuário 
    console.log("QuestDetailViewPage: Buscando perfil do usuário com ID:", session.user.id);
    try {
      // Verificar se o getUser confirma a autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("QuestDetailViewPage: Erro ao verificar usuário com getUser:", userError);
        return redirect("/auth/login");
      }
      
      console.log("QuestDetailViewPage: Usuário confirmado com getUser, ID:", user.id);
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileError || !profile) {
        console.error("QuestDetailViewPage: Erro ao buscar perfil:", profileError);
        return redirect("/auth/login");
      }
      
      // Buscar o game para verificar se existe
      console.log("QuestDetailViewPage: Buscando dados do game:", gameId);
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();
      
      if (gameError || !game) {
        console.error("QuestDetailViewPage: Erro ao buscar game:", gameError);
        throw new Error("Game não encontrado.");
      }
      
      // Buscar detalhes da quest específica
      console.log("QuestDetailViewPage: Buscando detalhes da quest:", questId);
      const { data: quest, error: questError } = await supabase
        .from("quests")
        .select("*")
        .eq("id", questId)
        .eq("game_id", gameId)
        .single();
        
      if (questError || !quest) {
        console.error("QuestDetailViewPage: Erro ao buscar quest:", questError);
        throw new Error("Quest não encontrada.");
      }
      
      if (!quest.visivel) {
        console.log("QuestDetailViewPage: Quest não está visível para equipes.");
        
        // Verificar se o usuário é admin para permitir visualização mesmo se não for visível
        if (!profile.is_admin) {
          console.log("QuestDetailViewPage: Usuário não é admin, redirecionando.");
          return redirect(`/gamerun/${gameId}/quests`);
        }
      }
      
      // Buscar equipe do usuário para este game
      console.log("QuestDetailViewPage: Buscando equipe do usuário no game");
      const { data: equipes, error: equipesError } = await supabase
        .from("equipe_integrantes")
        .select("equipe_id, status, game_equipes(*)")
        .eq("integrante_id", profile.id)
        .eq("status", "ativo");
      
      if (equipesError) {
        console.error("QuestDetailViewPage: Erro ao buscar equipes:", equipesError);
      }
      
      // Filtrar apenas equipes ativas deste game
      const equipesAtivas = equipes?.filter(eq => 
        eq.game_equipes?.game_id === gameId && 
        eq.game_equipes?.status === "ativa"
      ) || [];
      
      const equipe = equipesAtivas.length > 0 ? equipesAtivas[0].game_equipes : null;
      
      // Buscar o progresso da equipe para esta quest (se o usuário tiver equipe)
      let questProgress = null;
      if (equipe) {
        const { data: progress, error: progressError } = await supabase
          .from("equipe_quests")
          .select("*")
          .eq("equipe_id", equipe.id)
          .eq("quest_id", questId)
          .single();
          
        if (!progressError && progress) {
          questProgress = progress;
        }
      }
      
      return (
        <Suspense fallback={<div>Carregando detalhes da quest...</div>}>
          <div className="container mx-auto py-10">
            <QuestDetailPage 
              quest={quest}
              game={game}
              equipe={equipe}
              profileId={profile.id}
              questProgress={questProgress}
            />
          </div>
        </Suspense>
      );
    } catch (innerError: any) {
      console.error("QuestDetailViewPage: Erro interno:", innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error("QuestDetailViewPage: Erro geral na página:", error);
    
    // Verificar se é um erro de redirecionamento e retornar nulo
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      console.log("QuestDetailViewPage: Detectado erro de redirecionamento, retornando nulo");
      return null;
    }
    
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Erro ao carregar detalhes da quest</h1>
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h2 className="font-semibold text-lg mb-2">Ocorreu um erro</h2>
          <p>{error.message || "Não foi possível carregar os detalhes da quest. Tente novamente mais tarde."}</p>
        </div>
      </div>
    );
  }
} 