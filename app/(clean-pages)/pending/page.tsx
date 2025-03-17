'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { PendingActions, ExitToApp } from '@mui/icons-material';

export default function PendingPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/sign-in');
        return;
      }

      // Verificar se o usuário tem perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('user_id', session.user.id)
        .single();

      // Se não tem perfil ou já foi aprovado, redirecionar
      if (!profile) {
        router.push('/sign-in');
        return;
      }

      if (profile.is_approved) {
        router.push('/profile');
        return;
      }

      setEmail(session.user.email || null);
    }

    checkSession();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <div className="flex justify-center">
          <div className="bg-yellow-100 p-3 rounded-full">
            <PendingActions className="text-yellow-500 text-4xl" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800">Aprovação Pendente</h1>
        
        <p className="text-gray-600">
          Seu acesso ao Sistema Coringas está pendente de aprovação por um administrador. 
          Você receberá uma notificação quando sua conta for aprovada.
        </p>
        
        {email && (
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <p className="text-sm text-gray-500">Conta registrada</p>
            <p className="text-gray-700 font-medium">{email}</p>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          <ExitToApp className="mr-2" />
          Sair
        </button>
      </div>
    </div>
  );
} 