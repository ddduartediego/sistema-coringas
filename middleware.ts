import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const res = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  
  // Rotas públicas (acessíveis sem login)
  const publicRoutes = ["/", "/sign-in", "/sign-up", "/auth/callback"];
  // Rotas protegidas (requerem login)
  const protectedRoutes = ["/admin", "/profile", "/settings", "/pending", "/lideranca"];
  
  // Rotas específicas de administrador
  const adminRoutes = ["/admin", "/settings"];
  
  // Rotas específicas de liderança
  const leaderRoutes = ["/lideranca"];
  
  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isLeaderRoute = leaderRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Criar cookie store do Next.js compatível com middleware
    const cookieStore = cookies();
    
    // Criar cliente Supabase usando cookies da requisição
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    // Se não estiver autenticado, redirecionar para login
    if (!session) {
      const redirectUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se estiver em rota de admin, verificar se é administrador
    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_approved')
        .eq('user_id', session.user.id)
        .single();
      
      if (!profile || !profile.is_approved) {
        // Se não for aprovado, redirecionar para página de pendência
        const redirectUrl = new URL("/pending", request.url);
        return NextResponse.redirect(redirectUrl);
      }
      
      if (!profile.is_admin) {
        // Se não for admin, redirecionar para perfil
        const redirectUrl = new URL("/profile", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
    
    // Verificar se o usuário está aprovado
    if (pathname !== "/pending") {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('user_id', session.user.id)
        .single();
      
      if (profile && !profile.is_approved) {
        // Se não for aprovado, redirecionar para página de pendência
        const redirectUrl = new URL("/pending", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Se estiver em rota de liderança, verificar se é líder
    if (isLeaderRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_leader, is_approved')
        .eq('user_id', session.user.id)
        .single();
      
      if (!profile || !profile.is_approved) {
        // Se não for aprovado, redirecionar para página de pendência
        const redirectUrl = new URL("/pending", request.url);
        return NextResponse.redirect(redirectUrl);
      }
      
      if (!profile.is_leader) {
        // Se não for líder, redirecionar para perfil
        const redirectUrl = new URL("/profile", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
