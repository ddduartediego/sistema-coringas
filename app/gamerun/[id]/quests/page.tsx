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

      console.log("QuestsPage: Todas integrações do usuário:", todasIntegracoes || "Nenhuma");
      if (integracoesError) {
        console.error("QuestsPage: Erro ao buscar todas integrações:", integracoesError);
      }

      // Agora busque todas as equipes do game
      const { data: todasEquipesGame, error: equipesGameError } = await supabase
        .from("game_equipes")
        .select("id, nome, status")
        .eq("game_id", gameId);

      console.log("QuestsPage: Todas equipes do game:", todasEquipesGame || "Nenhuma");
      if (equipesGameError) {
        console.error("QuestsPage: Erro ao buscar todas equipes do game:", equipesGameError);
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

      console.log("QuestsPage: Equipes encontradas detalhadas:", 
        userEquipes?.map(eq => ({
          equipe_id: eq.equipe_id,
          status_integrante: eq.status,
          equipe: eq.game_equipes
        })) || "Nenhuma"
      );

      // Filtrar apenas equipes ativas localmente
      const equipesAtivas = userEquipes?.filter(eq => 
        eq.game_equipes?.game_id === gameId && 
        eq.game_equipes?.status === "ativa" &&
        eq.status === "ativo"
      );

      console.log("QuestsPage: Equipes ativas filtradas:", equipesAtivas?.length || 0);

      if (!equipesAtivas || equipesAtivas.length === 0) {
        console.log("QuestsPage: Usuário não pertence a nenhuma equipe ativa neste jogo");
        return (
          <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-4">Missões do Game</h1>
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
              <h2 className="font-semibold text-lg mb-2">Você não está em uma equipe ativa</h2>
              <p>Para acessar as missões do jogo, você precisa fazer parte de uma equipe ativa.</p>
              <p className="mt-2 text-sm">Status da sua participação: 
                {userEquipes?.length 
                  ? `Você pertence a equipes neste jogo, mas nenhuma está ativa.` 
                  : `Você não pertence a nenhuma equipe neste jogo.`}
              </p>
            </div>
          </div>
        );
      }
      
      // Obter a equipe do usuário
      const equipe = equipesAtivas[0].game_equipes;
      console.log("QuestsPage: Equipe obtida:", equipe);
      
      // Buscar quests disponíveis para este game
      console.log("QuestsPage: Buscando quests do game");
      const { data: quests, error: questsError } = await supabase
        .from("quests")
        .select("*")
        .eq("game_id", gameId);
        
      if (questsError) {
        console.error("QuestsPage: Erro ao buscar quests:", questsError);
        throw new Error("Não foi possível carregar as missões disponíveis.");
      }
      
      console.log("QuestsPage: Quests encontradas:", quests?.length || 0);
      
      return (
        <Suspense fallback={<div>Carregando missões...</div>}>
          <div className="container mx-auto py-10">
            <QuestsClient 
              gameId={gameId}
              equipe={equipe}
              quests={quests || []}
              profileId={profile.id}
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