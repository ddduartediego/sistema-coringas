import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (authError) {
      console.error('Erro na troca de código por sessão:', authError);
      return NextResponse.redirect(`${origin}/sign-in?error=Erro na autenticação`);
    }

    // Verificar se o usuário existe
    if (authData?.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (!existingProfile) {
        // Verificar se existe um perfil com este email (para o administrador pré-registrado)
        const { data: emailProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        if (emailProfile) {
          // Vincular o usuário ao perfil existente
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              user_id: authData.user.id,
              name: authData.user.user_metadata.full_name || emailProfile.name,
              avatar_url: authData.user.user_metadata.avatar_url || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailProfile.id);

          if (updateError) {
            console.error('Erro ao vincular perfil:', updateError);
          }
        } else {
          // Criar um novo perfil
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata.full_name || 'Usuário',
              avatar_url: authData.user.user_metadata.avatar_url || null,
              is_approved: false, // Usuário precisa ser aprovado pelo administrador
              is_admin: false
            });

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
          }
        }
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // Redirecionar para a página principal
  return NextResponse.redirect(`${origin}/`);
}
