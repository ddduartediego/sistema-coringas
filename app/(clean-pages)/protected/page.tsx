'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ProtectedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkProfile() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Primeiro, obter a sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/sign-in');
        return;
      }
      
      // Usar o ID do usuário da sessão
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
      } else {
        // Se o perfil não existe, redirecionar para página inicial
        router.push('/');
      }
      
      setLoading(false);
    }
    
    checkProfile();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
        <p className="text-xl text-gray-700">Redirecionando para a página adequada...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    </div>
  );
} 