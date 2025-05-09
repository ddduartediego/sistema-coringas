'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Sidebar from './Sidebar';
import { Database } from '@/models/database.types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getUserProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/sign-in');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!profile) {
        await supabase.auth.signOut();
        router.push('/sign-in');
        return;
      }

      if (!profile.is_approved) {
        router.push('/pending');
        return;
      }

      setIsAdmin(profile.is_admin || false);
      setIsLeader(profile.is_leader || false);
      setUserEmail(session.user.email || null);
      setUserName(profile.name || session.user.user_metadata?.name || null);
      setLoading(false);
    }

    getUserProfile();
  }, [router, supabase]);

  useEffect(() => {
    // Adicionar log para debug do viewport
    console.log('Viewport height:', window.innerHeight);
    console.log('Document height:', document.documentElement.clientHeight);
    
    const handleResize = () => {
      console.log('Resize - Viewport height:', window.innerHeight);
      console.log('Resize - Document height:', document.documentElement.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para atualizar o estado do sidebar
  const updateSidebarState = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 bg-gray-50">
      <Sidebar isAdmin={isAdmin} isLeader={isLeader} onCollapse={updateSidebarState} />
      
      <div className={`flex-1 flex flex-col w-full transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 