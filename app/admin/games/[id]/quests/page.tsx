import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import QuestsAdminClient from "./_components/QuestsAdminClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminQuestsPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  // Aguardar a resolução do params
  console.log("AdminQuestsPage: Iniciando função");
  const { id } = await params;
  const gameId = id;
  console.log("AdminQuestsPage: ID do jogo obtido:", gameId);
  
  try {
    // Criar cliente Supabase Server
    console.log("AdminQuestsPage: Criando cliente Supabase");
    const supabase = await createServerSupabaseClient();
    console.log("AdminQuestsPage: Cliente Supabase criado");
    
    // Verificar autenticação
    console.log("AdminQuestsPage: Verificando autenticação");
    const { data: { session } } = await supabase.auth.getSession();
    console.log("AdminQuestsPage: Sessão obtida:", session ? "Existe" : "Não existe");
    
    if (!session) {
      console.log("AdminQuestsPage: Usuário não autenticado. Redirecionando para login.");
      return redirect("/auth/login");
    }
    
    // Exibir detalhes do usuário da sessão para debug
    console.log("AdminQuestsPage: ID do usuário na sessão:", session.user.id);
    console.log("AdminQuestsPage: Email do usuário na sessão:", session.user.email);
    
    // Buscar perfil do usuário de forma mais segura
    console.log("AdminQuestsPage: Buscando perfil do usuário com ID:", session.user.id);
    try {
      // Verificar se o getUser confirma a autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("AdminQuestsPage: Erro ao verificar usuário com getUser:", userError);
        return redirect("/auth/login");
      }
      
      console.log("AdminQuestsPage: Usuário confirmado com getUser, ID:", user.id);
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (profileError) {
        console.error("AdminQuestsPage: Erro ao buscar perfil:", profileError);
        console.log("AdminQuestsPage: Detalhes completos do erro:", JSON.stringify(profileError));
        
        // Verificar se o perfil existe sem usar .single()
        const { data: profileCheck, error: checkError } = await supabase
          .from("profiles")
          .select("id, is_admin, user_id")
          .eq("user_id", user.id);
          
        console.log("AdminQuestsPage: Verificação alternativa de perfil:", 
          profileCheck ? `Encontrado(s) ${profileCheck.length} perfil(is)` : "Nenhum perfil encontrado");
        
        if (checkError) {
          console.error("AdminQuestsPage: Erro na verificação alternativa:", checkError);
        }
        
        // Se não encontrou perfil, tentar criar um perfil básico
        if (!profileCheck || profileCheck.length === 0) {
          console.log("AdminQuestsPage: Usuário autenticado sem perfil, redirecionando para completar cadastro");
          return redirect("/complete-profile");
        }
        
        return redirect("/auth/login");
      }
      
      if (!profile) {
        console.error("AdminQuestsPage: Perfil não encontrado para o usuário:", user.id);
        return redirect("/auth/login");
      }
      
      console.log("AdminQuestsPage: Verificando se usuário é admin:", profile.is_admin);
      if (!profile.is_admin) {
        console.log("AdminQuestsPage: Usuário não é administrador. Redirecionando para página inicial.");
        return redirect("/dashboard");
      }
      
      // Buscar detalhes do game
      console.log("AdminQuestsPage: Buscando detalhes do game:", gameId);
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();
      
      if (gameError || !game) {
        console.error("AdminQuestsPage: Erro ao buscar game:", gameError);
        throw new Error("Game não encontrado.");
      }
      
      // Buscar todas as quests do game
      console.log("AdminQuestsPage: Buscando quests do game");
      const { data: quests, error: questsError } = await supabase
        .from("quests")
        .select("*")
        .eq("game_id", gameId)
        .order("numero", { ascending: true })
        .order("created_at", { ascending: true });
      
      if (questsError) {
        console.error("AdminQuestsPage: Erro ao buscar quests:", questsError);
        throw new Error("Não foi possível carregar as quests.");
      }
      
      console.log("AdminQuestsPage: Renderizando página com", quests?.length || 0, "quests");
      return (
        <Suspense fallback={<div>Carregando quests do game...</div>}>
          <div className="container mx-auto py-10">
            <QuestsAdminClient 
              game={game}
              quests={quests || []}
            />
          </div>
        </Suspense>
      );
    } catch (innerError: any) {
      console.error("AdminQuestsPage: Erro interno:", innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error("AdminQuestsPage: Erro geral na página:", error);
    
    // Verificar se é um erro de redirecionamento e retornar nulo
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      console.log("AdminQuestsPage: Detectado erro de redirecionamento, retornando nulo");
      return null;
    }
    
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Erro ao carregar quests</h1>
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h2 className="font-semibold text-lg mb-2">Ocorreu um erro</h2>
          <p>{error.message || "Não foi possível carregar as quests. Tente novamente mais tarde."}</p>
        </div>
      </div>
    );
  }
} 