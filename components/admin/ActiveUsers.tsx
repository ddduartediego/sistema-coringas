'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import { Person, Refresh, Info, Close } from '@mui/icons-material';

interface ActiveUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  last_seen: string;
  device_info?: string;
}

interface UserDetailsModalProps {
  user: ActiveUser;
  onClose: () => void;
}

function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const deviceInfo = user.device_info ? JSON.parse(user.device_info) : null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Detalhes do Usuário</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Close />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Nome</p>
            <p className="text-gray-900">{user.name}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Online desde</p>
            <p className="text-gray-900">{new Date(user.last_seen).toLocaleString('pt-BR')}</p>
          </div>
          
          {deviceInfo && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Navegador/Sistema</p>
                <p className="text-gray-900">{deviceInfo.userAgent}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Plataforma</p>
                <p className="text-gray-900">{deviceInfo.platform}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Resolução</p>
                <p className="text-gray-900">{deviceInfo.screenSize}</p>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ActiveUsersListModalProps {
  users: ActiveUser[];
  onClose: () => void;
  onUserClick: (user: ActiveUser) => void;
}

function ActiveUsersListModal({ users, onClose, onUserClick }: ActiveUsersListModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Usuários Online</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Close />
          </button>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum usuário online no momento.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => onUserClick(user)}
              >
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Online desde: {new Date(user.last_seen).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActiveUsers() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchActiveUsers = async () => {
    setLoading(true);
    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('*')
        .order('last_seen', { ascending: false });

      if (sessionsError) {
        console.error('Erro ao buscar sessões:', sessionsError);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setActiveUsers([]);
        return;
      }

      const userIds = sessions.map(session => session.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        return;
      }

      const profileMap = new Map(
        profiles?.map(profile => [profile.user_id, profile]) || []
      );

      const formatted = sessions.map(session => {
        const profile = profileMap.get(session.user_id);
        return {
          id: session.id,
          user_id: session.user_id,
          name: profile?.name || 'Usuário sem nome',
          email: profile?.email || 'Email não disponível',
          last_seen: session.last_seen,
          device_info: session.device_info
        };
      });

      setActiveUsers(formatted);
    } catch (error) {
      console.error('Erro ao processar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários online quando o componente for montado
  useEffect(() => {
    fetchActiveUsers();
  }, []);

  const handleUserClick = (user: ActiveUser) => {
    setSelectedUser(user);
    setShowUsersList(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Person className="text-blue-600" />
          <h2 className="text-sm font-medium">Usuários Online</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {activeUsers.length} online
          </span>
          <button
            onClick={() => setShowUsersList(true)}
            className="p-1 rounded-full text-blue-600 hover:bg-blue-50"
            title="Ver lista de usuários"
          >
            <Info fontSize="small" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchActiveUsers}
            disabled={loading}
            className={`p-1 rounded-full ${
              loading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            title="Atualizar"
          >
            <Refresh className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {showUsersList && (
        <ActiveUsersListModal
          users={activeUsers}
          onClose={() => setShowUsersList(false)}
          onUserClick={handleUserClick}
        />
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
} 