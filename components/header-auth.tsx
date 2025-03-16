import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  let userName = null;
  
  if (user) {
    // Buscar perfil para obter o nome
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();
      
    userName = profile?.name || user.user_metadata?.name || user.email;
  }

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              Atualize o arquivo .env.local com as chaves do Supabase
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">Entrar</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 text-primary-600">
          {userName ? userName.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="font-medium">{userName}</span>
      </div>
      <form action={signOutAction}>
        <Button type="submit" variant={"outline"} size="sm">
          Sair
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Entrar</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Cadastrar</Link>
      </Button>
    </div>
  );
}
