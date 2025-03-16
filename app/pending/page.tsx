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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <PendingActions className="text-yellow-500 text-6xl" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Aprovação Pendente</h1>
        
        <p className="text-gray-600 mb-6">
          Seu acesso ao Sistema Coringas está pendente de aprovação por um administrador. 
          Você receberá uma notificação quando sua conta for aprovada.
        </p>
        
        {email && (
          <div className="bg-gray-50 p-3 rounded-md mb-6">
            <p className="text-sm text-gray-500">Conta registrada</p>
            <p className="text-gray-700 font-medium">{email}</p>
          </div>
        )}
        
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
        >
          <ExitToApp className="mr-2" />
          Sair
        </button>
      </div>
    </div>
  );
} 