import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import QuestsClient from "./_components/QuestsClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function QuestsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  // Aguardar a resolução do params
  console.log("QuestsPage: Iniciando função");
  const { id } = await params;
  const gameId = id;
  console.log("QuestsPage: ID do jogo obtido:", gameId);
  
  try {
    // Criar cliente Supabase Server
    console.log("QuestsPage: Criando cliente Supabase");
    const supabase = await createServerSupabaseClient();
    console.log("QuestsPage: Cliente Supabase criado");
    
    // Verificar autenticação
    console.log("QuestsPage: Verificando autenticação");
    const { data: { session } } = await supabase.auth.getSession();
    console.log("QuestsPage: Sessão obtida:", session ? "Existe" : "Não existe");
    
    if (!session) {
      console.log("QuestsPage: Usuário não autenticado. Redirecionando para login.");
      return redirect("/auth/login");
    }
    
    // Exibir detalhes do usuário da sessão para debug
    console.log("QuestsPage: ID do usuário na sessão:", session.user.id);
    console.log("QuestsPage: Email do usuário na sessão:", session.user.email);
    
    // Buscar perfil do usuário de forma mais segura
    console.log("QuestsPage: Buscando perfil do usuário com ID:", session.user.id);
    try {
      // Verificar se o getUser confirma a autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("QuestsPage: Erro ao verificar usuário com getUser:", userError);
        return redirect("/auth/login");
      }
      
      console.log("QuestsPage: Usuário confirmado com getUser, ID:", user.id);
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileError) {
        console.error("QuestsPage: Erro ao buscar perfil:", profileError);
        console.log("QuestsPage: Detalhes completos do erro:", JSON.stringify(profileError));
        
        // Verificar se o perfil existe sem usar .single()
        const { data: profileCheck, error: checkError } = await supabase
          .from("profiles")
          .select("id, user_id")
          .eq("user_id", user.id);
          
        console.log("QuestsPage: Verificação alternativa de perfil:", 
          profileCheck ? `Encontrado(s) ${profileCheck.length} perfil(is)` : "Nenhum perfil encontrado");
        
        if (checkError) {
          console.error("QuestsPage: Erro na verificação alternativa:", checkError);
        }
        
        // Se não encontrou perfil, tentar criar um perfil básico
        if (!profileCheck || profileCheck.length === 0) {
          console.log("QuestsPage: Usuário autenticado sem perfil, redirecionando para completar cadastro");
          return redirect("/complete-profile");
        }
        
        return redirect("/auth/login");
      }
      
      if (!profile) {
        console.error("QuestsPage: Perfil não encontrado para o usuário:", user.id);
        return redirect("/auth/login");
      }
      
      // Buscar equipe do usuário no jogo
      console.log("QuestsPage: Buscando equipe do usuário no jogo para profile.id:", profile.id, "e gameId:", gameId);

      // Primeiro, verifique todas as integrações do usuário
      const { data: todasIntegracoes, error: integracoesError } = await supabase
        .from("equipe_integrantes")
        .select("equipe_id, status")
        .eq("integrante_id", profile.id);

      
      if (integracoesError) {
        console.error("QuestsPage: Erro ao buscar todas integrações:", integracoesError);
      }

      // Agora busque todas as equipes do game
      const { data: todasEquipesGame, error: equipesGameError } = await supabase
        .from("game_equipes")
        .select("id, nome, status")
        .eq("game_id", gameId);

      
      if (equipesGameError) {
        
      }

      // Buscar a interseção - equipes do game que o usuário participa
      const { data: userEquipes, error: equipeError } = await supabase
        .from("equipe_integrantes")
        .select("equipe_id, status, game_equipes(*)")
        .eq("integrante_id", profile.id)
        .in("equipe_id", todasEquipesGame?.map(eq => eq.id) || [])
        .limit(10);

      if (equipeError) {
        console.error("QuestsPage: Erro ao buscar equipes:", equipeError);
      }

            // Filtrar apenas equipes ativas localmente
      const equipesAtivas = userEquipes?.filter(eq => 
        eq.game_equipes?.game_id === gameId && 
        eq.game_equipes?.status === "ativa" &&
        eq.status === "ativo"
      );

      console.log("QuestsPage: Equipes ativas filtradas:", equipesAtivas?.length || 0);

      // Se o usuário não tem equipe ativa, mostrar apenas a mensagem informativa
      if (!equipesAtivas || equipesAtivas.length === 0) {
        console.log("QuestsPage: Usuário não pertence a nenhuma equipe ativa neste jogo");
        return (
          <div className="container mx-auto py-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl bg-blue-50 p-8 rounded-lg border border-blue-100 shadow-sm">
              <div className="flex flex-col items-center text-center mb-6">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-blue-500 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Quests do Game</h1>
                <div className="w-20 h-1 bg-blue-500 rounded mb-6"></div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Status da sua participação</h2>
                <p className="text-gray-600 mb-3">
                  Para visualizar e participar das quests do jogo, você precisa estar em uma equipe ativa.
                </p>
                <p className="text-gray-600 mb-6 font-medium">
                  {userEquipes?.length 
                    ? `Você pertence a uma equipe neste jogo, mas ela não está ativa.` 
                    : `Você ainda não pertence a uma equipe neste jogo.`}
                </p>
                <a 
                  href={`/gamerun/${gameId}`}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-md shadow hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                    />
                  </svg>
                  Ver detalhes do Game
                </a>
              </div>
            </div>
          </div>
        );
      }
      
      // Obter a equipe do usuário
      const equipe = equipesAtivas[0].game_equipes;
      
      
      // Buscar quests disponíveis para este game
      console.log("QuestsPage: Buscando quests do game");
      const { data: questsData, error: questsError } = await supabase
        .from("quests")
        .select("*")
        .eq("game_id", gameId);
        
      if (questsError) {
        console.error("QuestsPage: Erro ao buscar quests:", questsError);
        throw new Error("Não foi possível carregar as missões disponíveis.");
      }
      
      // Garantir que todas as quests tenham as propriedades requeridas
      const quests = questsData?.map(quest => ({
        ...quest,
        visivel: quest.visivel ?? false,
        numero: quest.numero !== undefined ? quest.numero : null
      })) || [];
      
      console.log("QuestsPage: Quests encontradas:", quests?.length || 0);
      
      // *** NOVA BUSCA: Buscar progresso da equipe nas quests ***
      let questProgressList: QuestProgress[] = [];
      if (equipe && quests && quests.length > 0) {
        const questIds = quests.map(q => q.id);
        console.log(`QuestsPage: Buscando progresso para equipe ${equipe.id} e ${questIds.length} quests.`);
        const { data: progressData, error: progressError } = await supabase
          .from('equipe_quests')
          .select('quest_id, status, data_inicio') // Incluir data_inicio se quisermos usar depois
          .eq('equipe_id', equipe.id)
          .in('quest_id', questIds);
          
        if (progressError) {
          console.error("QuestsPage: Erro ao buscar progresso das quests:", progressError);
          // Não lançar erro, podemos continuar sem os status individuais
        } else {
          questProgressList = progressData || [];
          console.log("QuestsPage: Progresso encontrado:", questProgressList.length);
        }
      }
      
      // Definir interface QuestProgress (pode ser movida para um arquivo de tipos)
      interface QuestProgress {
        quest_id: string;
        status: string;
        data_inicio?: string | null;
      }
      
      return (
        <Suspense fallback={<div>Carregando missões...</div>}>
          <div className="container mx-auto py-10">
            <QuestsClient 
              gameId={gameId}
              equipe={equipe}
              quests={quests}
              profileId={profile.id}
              questProgressList={questProgressList} // Passar a nova prop
            />
          </div>
        </Suspense>
      );
    } catch (innerError: any) {
      console.error("QuestsPage: Erro interno:", innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error("QuestsPage: Erro geral na página:", error);
    
    // Verificar se é um erro de redirecionamento e retornar nulo
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      console.log("QuestsPage: Detectado erro de redirecionamento, retornando nulo");
      return null;
    }
    
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Erro ao carregar missões</h1>
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h2 className="font-semibold text-lg mb-2">Ocorreu um erro</h2>
          <p>{error.message || "Não foi possível carregar as missões. Tente novamente mais tarde."}</p>
        </div>
      </div>
    );
  }
} 