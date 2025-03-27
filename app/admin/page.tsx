'use client';

import { useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import dynamic from 'next/dynamic';
import { 
  Dashboard, 
  CheckCircle, 
  Cancel, 
  Person, 
  PersonAdd, 
  HourglassEmpty,
  Close,
  FilterList,
  Search,
  PieChart,
  Edit
} from '@mui/icons-material';
import ActiveUsers from '@/components/admin/ActiveUsers';

// Importar o framer-motion dinamicamente para evitar erros de SSR
const MotionDiv = dynamic(() => 
  import('framer-motion').then((mod) => mod.motion.div), 
  { ssr: false }
);

interface MotionProps {
  children: ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
}

const MotionComponent = ({ children, ...props }: MotionProps) => (
  <MotionDiv {...props}>{children}</MotionDiv>
);

interface User {
  id: string;
  email: string;
  name: string;
  is_approved: boolean;
  created_at: string;
  status?: string;
  role?: string;
  is_admin?: boolean;
  avatar_url?: string;
}

interface StatusCount {
  status: string;
  count: number;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0
  });
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [userToApprove, setUserToApprove] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [roleOptions, setRoleOptions] = useState<{id: string, name: string}[]>([]);
  const [statusOptions, setStatusOptions] = useState<{id: string, name: string}[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    role: '',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Carregar dados de usuários
  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar estatísticas
        const { data: totalUsers, error: totalError } = await supabase
          .from('profiles')
          .select('id, is_approved');
          
        if (totalError) throw totalError;

        // Buscar usuários pendentes
        const { data: pendingUsersData, error: pendingError } = await supabase
          .from('profiles')
          .select('id, email, name, is_approved, created_at')
          .eq('is_approved', false)
          .order('created_at', { ascending: false });
          
        if (pendingError) throw pendingError;

        // Buscar usuários aprovados
        const { data: approvedUsersData, error: approvedError } = await supabase
          .from('profiles')
          .select('id, email, name, is_approved, created_at, status, role, is_admin, avatar_url')
          .eq('is_approved', true)
          .order('created_at', { ascending: false });
          
        if (approvedError) throw approvedError;

        // Buscar opções de funções
        const { data: roles } = await supabase
          .from('config_roles')
          .select('id, name');

        setRoleOptions(roles || []);
        
        // Buscar opções de status
        const { data: status } = await supabase
          .from('config_status')
          .select('id, name');
        
        setStatusOptions(status || []);

        // Calcular estatísticas
        const approvedCount = totalUsers ? totalUsers.filter(user => user.is_approved).length : 0;
        const pendingCount = totalUsers ? totalUsers.filter(user => !user.is_approved).length : 0;
        
        // Calcular contagem por status
        const statusMap = new Map<string, number>();
        approvedUsersData?.forEach(user => {
          if (user.status) {
            const count = statusMap.get(user.status) || 0;
            statusMap.set(user.status, count + 1);
          }
        });
        
        const statusCountArray: StatusCount[] = [];
        statusMap.forEach((count, status) => {
          statusCountArray.push({ status, count });
        });
        
        setStatusCounts(statusCountArray);
        setStats({
          total: totalUsers ? totalUsers.length : 0,
          approved: approvedCount,
          pending: pendingCount
        });

        setPendingUsers(pendingUsersData || []);
        setApprovedUsers(approvedUsersData || []);
        setFilteredUsers(approvedUsersData || []);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Aplicar filtros quando mudar
  useEffect(() => {
    if (activeTab === 'all') {
      let result = [...approvedUsers];
      
      if (filters.status) {
        result = result.filter(user => user.status === filters.status);
      }
      
      if (filters.role) {
        result = result.filter(user => user.role === filters.role);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        result = result.filter(user => 
          user.name.toLowerCase().includes(term) || 
          user.email.toLowerCase().includes(term)
        );
      }
      
      setFilteredUsers(result);
    }
  }, [filters, approvedUsers, activeTab]);

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      status: '',
      role: '',
      searchTerm: ''
    });
  };

  // Iniciar processo de aprovação (abrir modal)
  const startApprovalProcess = (userId: string) => {
    setUserToApprove(userId);
    setSelectedStatus('');
    setSelectedRole('Membro'); // Definir um valor padrão para função
  };

  // Cancelar processo de aprovação
  const cancelApprovalProcess = () => {
    setUserToApprove(null);
    setSelectedStatus('');
  };

  // Completar aprovação do usuário com status selecionado
  const completeApproval = async () => {
    if (!userToApprove || !selectedStatus) {
      setMessage({
        type: 'error',
        text: 'Selecione um status para o usuário antes de aprovar.'
      });
      return;
    }

    try {
      setProcessingUser(userToApprove);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_approved: true,
          role: selectedRole, // Mantém o valor padrão
          status: selectedStatus // Usa o status selecionado pelo administrador
        })
        .eq('id', userToApprove);

      if (error) throw error;

      // Atualizar listas
      const userToMove = pendingUsers.find(user => user.id === userToApprove);
      if (userToMove) {
        const updatedUser = { 
          ...userToMove, 
          is_approved: true, 
          status: selectedStatus,
          role: selectedRole
        };
        
        setPendingUsers(pendingUsers.filter(user => user.id !== userToApprove));
        setApprovedUsers([updatedUser, ...approvedUsers]);
        setFilteredUsers([updatedUser, ...filteredUsers]);
        
        // Atualizar contagem de status
        const newStatusCounts = [...statusCounts];
        const existingStatusIndex = newStatusCounts.findIndex(s => s.status === selectedStatus);
        
        if (existingStatusIndex >= 0) {
          newStatusCounts[existingStatusIndex].count++;
        } else {
          newStatusCounts.push({ status: selectedStatus, count: 1 });
        }
        
        setStatusCounts(newStatusCounts);
        
        setStats({
          ...stats,
          pending: stats.pending - 1,
          approved: stats.approved + 1
        });
      }

      setMessage({
        type: 'success',
        text: 'Usuário aprovado com sucesso!'
      });

      // Fechar modal
      setUserToApprove(null);
      setSelectedStatus('');
    } catch (error: any) {
      console.error('Erro ao processar usuário:', error);
      setMessage({
        type: 'error',
        text: `Erro ao processar usuário: ${error.message}`
      });
    } finally {
      setProcessingUser(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Rejeitar usuário
  const rejectUser = async (userId: string) => {
    try {
      setProcessingUser(userId);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: false })
        .eq('id', userId);

      if (error) throw error;

      // Remover das listas
      const userToRemove = [...pendingUsers, ...approvedUsers].find(user => user.id === userId);
      if (userToRemove) {
        if (userToRemove.is_approved) {
          // Atualizar contagem de status se o usuário removido tiver um status
          if (userToRemove.status) {
            const newStatusCounts = [...statusCounts];
            const statusIndex = newStatusCounts.findIndex(s => s.status === userToRemove.status);
            
            if (statusIndex >= 0 && newStatusCounts[statusIndex].count > 0) {
              newStatusCounts[statusIndex].count--;
              if (newStatusCounts[statusIndex].count === 0) {
                newStatusCounts.splice(statusIndex, 1);
              }
              setStatusCounts(newStatusCounts);
            }
          }
          
          setApprovedUsers(approvedUsers.filter(user => user.id !== userId));
          setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
          setStats({
            ...stats,
            total: stats.total - 1,
            approved: stats.approved - 1
          });
        } else {
          setPendingUsers(pendingUsers.filter(user => user.id !== userId));
          setStats({
            ...stats,
            total: stats.total - 1,
            pending: stats.pending - 1
          });
        }
      }

      setMessage({
        type: 'success',
        text: 'Usuário rejeitado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao processar usuário:', error);
      setMessage({
        type: 'error',
        text: `Erro ao processar usuário: ${error.message}`
      });
    } finally {
      setProcessingUser(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Iniciar edição de usuário
  const startEditUser = (userId: string) => {
    const user = approvedUsers.find(u => u.id === userId);
    if (user) {
      setUserToApprove(userId);
      setSelectedStatus(user.status || '');
      setSelectedRole(user.role || 'Membro');
    }
  };

  // Completar edição do usuário
  const completeEdit = async () => {
    if (!userToApprove || !selectedStatus || !selectedRole) {
      setMessage({
        type: 'error',
        text: 'Selecione um status e uma função para o usuário.'
      });
      return;
    }

    try {
      setProcessingUser(userToApprove);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: selectedStatus,
          role: selectedRole
        })
        .eq('id', userToApprove);

      if (error) throw error;

      // Atualizar listas
      const updatedUsers = approvedUsers.map(user => {
        if (user.id === userToApprove) {
          return { ...user, status: selectedStatus, role: selectedRole };
        }
        return user;
      });
      
      setApprovedUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      setMessage({
        type: 'success',
        text: 'Usuário atualizado com sucesso!'
      });

      // Fechar modal
      setUserToApprove(null);
      setSelectedStatus('');
      setSelectedRole('');
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      setMessage({
        type: 'error',
        text: `Erro ao atualizar usuário: ${error.message}`
      });
    } finally {
      setProcessingUser(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Administração</h1>
            <p className="text-gray-600 mb-6">Carregando dados do sistema...</p>
            <div className="flex justify-center">
              <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Descrição da página */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Administração</h1>
          <p className="text-gray-600">Gerencie os integrantes do sistema e monitore as estatísticas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Usuários Online */}
        <ActiveUsers />

        {/* Total de Integrantes com Integrantes por Status */}
        <MotionComponent 
          className="bg-white rounded-xl shadow-md overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6">
            <div className="flex items-center mb-4">
              <div className="rounded-full bg-blue-500 p-3 mr-4 text-white">
                <Person />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Total de Integrantes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
            
            {/* Integrado: Integrantes por Status */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center mb-2">
                <div className="rounded-full bg-purple-500 p-2 mr-2 text-white">
                  <PieChart fontSize="small" />
                </div>
                <h3 className="text-sm font-medium text-purple-800">
                  Integrantes por Status
                </h3>
              </div>
              <div className="space-y-1">
                {statusCounts.map(({ status, count }) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600">{status}</span>
                    <span className="text-xs font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionComponent>

        {/* Pendentes */}
        <MotionComponent 
          className="bg-white rounded-xl shadow-md overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 p-6 flex items-center">
            <div className="rounded-full bg-yellow-500 p-3 mr-4 text-white">
              <HourglassEmpty />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </MotionComponent>
      </div>

      {/* Lista de Integrantes com Filtros */}
      <MotionComponent 
        className="bg-white rounded-xl shadow-md overflow-hidden mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex">
              <button
                className={`px-4 py-2 font-medium transition-colors ${activeTab === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => { setActiveTab('pending'); resetFilters(); }}
              >
                Pendentes de Aprovação
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => { setActiveTab('all'); resetFilters(); }}
              >
                Todos os Integrantes
              </button>
            </div>
            
            {activeTab === 'all' && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <FilterList className="mr-1" fontSize="small" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
            )}
          </div>
          
          {/* Filtros */}
          {activeTab === 'all' && showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {statusOptions.map(option => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Função
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({...filters, role: e.target.value})}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    {roleOptions.map(option => (
                      <option key={option.id} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Buscar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                      placeholder="Nome ou email"
                      className="w-full p-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Search className="absolute left-2 top-2 text-gray-400" fontSize="small" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={resetFilters}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo das abas */}
        <div className="p-6">
          {activeTab === 'pending' && (
            <>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PersonAdd className="text-gray-300 text-5xl mx-auto mb-4" />
                  <p className="text-lg">Não há usuários pendentes de aprovação</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Registro
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(user.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => startApprovalProcess(user.id)}
                                disabled={processingUser === user.id}
                                className="text-green-600 hover:text-green-800 disabled:opacity-50 p-1 rounded-full hover:bg-green-50 transition-colors"
                                title="Aprovar"
                              >
                                <CheckCircle />
                              </button>
                              <button
                                onClick={() => rejectUser(user.id)}
                                disabled={processingUser === user.id}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Rejeitar"
                              >
                                <Cancel />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'all' && (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PersonAdd className="text-gray-300 text-5xl mx-auto mb-4" />
                  <p className="text-lg">
                    {(filters.status || filters.role || filters.searchTerm) 
                      ? 'Nenhum integrante encontrado com os filtros aplicados' 
                      : 'Não há integrantes aprovados no sistema'}
                  </p>
                  {(filters.status || filters.role || filters.searchTerm) && (
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-blue-600 hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Função
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Registro
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {user.avatar_url ? (
                                  <img 
                                    src={user.avatar_url} 
                                    alt="" 
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Person className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                {user.is_admin && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                    Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {user.status || 'Aprovado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{user.role || 'Membro'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(user.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => startEditUser(user.id)}
                                disabled={processingUser === user.id}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                title="Editar"
                              >
                                <Edit />
                              </button>
                              <button
                                onClick={() => rejectUser(user.id)}
                                disabled={processingUser === user.id || user.is_admin}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Remover acesso"
                              >
                                <Cancel />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </MotionComponent>

      {/* Modal de seleção de status para aprovação/edição */}
      {userToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <MotionComponent 
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 -m-6 mb-6 px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                {approvedUsers.find(u => u.id === userToApprove)?.is_approved 
                  ? 'Editar Usuário' 
                  : 'Aprovar Usuário'
                }
              </h3>
              <button 
                onClick={cancelApprovalProcess}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <Close />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status:
                </label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Selecione um status...</option>
                  {statusOptions.map(option => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função:
                </label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Selecione uma função...</option>
                  {roleOptions.map(option => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={cancelApprovalProcess}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={approvedUsers.find(u => u.id === userToApprove)?.is_approved 
                  ? completeEdit 
                  : completeApproval
                }
                disabled={!selectedStatus || !selectedRole || processingUser === userToApprove}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors disabled:bg-blue-400"
              >
                {processingUser === userToApprove ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </div>
                ) : (
                  approvedUsers.find(u => u.id === userToApprove)?.is_approved 
                    ? 'Salvar Alterações'
                    : 'Aprovar Usuário'
                )}
              </button>
            </div>
          </MotionComponent>
        </div>
      )}
    </div>
  );
} 