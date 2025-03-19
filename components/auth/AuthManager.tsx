'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Database } from '@/models/database.types';

export default function AuthManager({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Registrar sessão ao carregar a página
    const registerSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          // Capturar informações do navegador/dispositivo
          const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenSize: `${window.screen.width}x${window.screen.height}`
          };
          
          // Registrar ou atualizar sessão
          await supabase
            .from('active_sessions')
            .upsert({
              user_id: session.user.id,
              last_seen: new Date().toISOString(),
              device_info: JSON.stringify(deviceInfo)
            }, {
              onConflict: 'user_id'
            });
        } catch (error) {
          console.error('Erro ao registrar sessão:', error);
        }
      }
    };

    registerSession();

    // Configurar handler para logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        try {
          // Remover sessão ao fazer logout
          if (session) {
            await supabase
              .from('active_sessions')
              .delete()
              .eq('user_id', session.user.id);
          }
        } catch (error) {
          console.error('Erro ao remover sessão:', error);
        }
      } else if (event === 'SIGNED_IN' && session) {
        registerSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return children;
} 