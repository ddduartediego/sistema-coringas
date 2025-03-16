'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Groups, 
  Security, 
  Person, 
  CheckCircle, 
  ArrowForward 
} from '@mui/icons-material';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Usando o useEffect para garantir que createBrowserClient é chamado apenas no cliente
  useEffect(() => {
    setIsClient(true);
    
    async function checkSession() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Buscar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_approved, is_admin')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          if (!profile.is_approved) {
            router.push('/pending');
          } else if (profile.is_admin) {
            router.push('/admin');
          } else {
            router.push('/profile');
          }
        }
      } else {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <span className="bg-gradient-to-r from-primary-500 to-primary-700 text-transparent bg-clip-text text-3xl font-bold">
              Sistema Coringas
            </span>
          </div>
          <Link 
            href="/sign-in" 
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-md transition-colors duration-300 flex items-center text-sm font-medium"
          >
            Entrar <ArrowForward className="ml-1 text-sm" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:py-24 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="text-center md:text-left md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Gestão de Integrantes
            </h2>
            <p className="mt-4 text-xl text-gray-500 max-w-3xl">
              Sistema desenvolvido para facilitar a gestão de integrantes da Equipe Coringas com interface moderna e clean.
            </p>
            <div className="mt-8">
              <Link
                href="/sign-in"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all hover:shadow"
              >
                Acessar Sistema <ArrowForward className="ml-2" />
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
                <h3 className="text-xl font-bold">Sistema Coringas</h3>
                <p className="mt-1 text-primary-100">Plataforma de gestão de integrantes</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" />
                  <p>Gestão completa de integrantes</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" />
                  <p>Perfis personalizados</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" />
                  <p>Autenticação segura</p>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-3" />
                  <p>Interface administrativa intuitiva</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Funcionalidades</h3>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Tudo em um só lugar
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Gerencie todos os integrantes da equipe em uma única plataforma.
              </p>
            </div>

            <div className="mt-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gray-50 rounded-xl p-8 hover:shadow-md transition-shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-md text-primary-600 mb-4">
                    <Groups className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Gestão de Integrantes</h4>
                  <p className="text-gray-500">
                    Gerencie todos os dados e informações dos integrantes da equipe em um único lugar.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-8 hover:shadow-md transition-shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-md text-primary-600 mb-4">
                    <Security className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Autenticação Segura</h4>
                  <p className="text-gray-500">
                    Login integrado com o Google e aprovação de novos usuários pelo administrador.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-8 hover:shadow-md transition-shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-md text-primary-600 mb-4">
                    <Person className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Perfis Personalizados</h4>
                  <p className="text-gray-500">
                    Cada integrante possui seu perfil completo com todas as informações necessárias.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-8 hover:shadow-md transition-shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-md text-primary-600 mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Administração Simples</h4>
                  <p className="text-gray-500">
                    Interface administrativa intuitiva para os gestores da equipe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Sistema Coringas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
