'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import AppLayout from '@/components/layout/AppLayout';
import { 
  Dashboard, 
  CheckCircle, 
  Cancel, 
  Person, 
  PersonAdd, 
  HourglassEmpty,
  Close,
  FilterList,
  Search
} from '@mui/icons-material';

interface User {
  id: string;
  email: string;
  name: string;
  is_approved: boolean;
  created_at: string;
  status?: string;
  role?: string;
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
          .select('id, is_approved')
          .not('is_admin', 'eq', true);
          
        if (totalError) throw totalError;

        // Buscar usuários pendentes
        const { data: pendingUsersData, error: pendingError } = await supabase
          .from('profiles')
          .select('id, email, name, is_approved, created_at')
          .eq('is_approved', false)
          .not('is_admin', 'eq', true)
          .order('created_at', { ascending: false });
          
        if (pendingError) throw pendingError;

        // Buscar usuários aprovados
        const { data: approvedUsersData, error: approvedError } = await supabase
          .from('profiles')
          .select('id, email, name, is_approved, created_at, status, role')
          .eq('is_approved', true)
          .not('is_admin', 'eq', true)
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
      <AppLayout>
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Dashboard className="text-primary-600 text-3xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Administração</h1>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <Person className="text-blue-500 text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Integrantes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <HourglassEmpty className="text-yellow-500 text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-3">Integrantes por Status</p>
            <div className="space-y-2 max-h-28 overflow-y-auto">
              {statusCounts.length > 0 ? (
                statusCounts.map((item) => (
                  <div key={item.status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{item.status}</span>
                    <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum integrante aprovado</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Integrantes com Filtros */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center px-6 py-4">
              <div className="flex">
                <button
                  className={`px-4 py-2 font-medium transition-colors ${activeTab === 'pending' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => { setActiveTab('pending'); resetFilters(); }}
                >
                  Pendentes de Aprovação
                </button>
                <button
                  className={`px-4 py-2 font-medium transition-colors ${activeTab === 'all' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => { setActiveTab('all'); resetFilters(); }}
                >
                  Todos os Integrantes
                </button>
              </div>
              
              {activeTab === 'all' && (
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600"
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
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                        className="w-full p-2 pl-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <Search className="absolute left-2 top-2 text-gray-400" fontSize="small" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={resetFilters}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800"
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
                        className="mt-2 text-primary-600 hover:underline"
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
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
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
                                  onClick={() => rejectUser(user.id)}
                                  disabled={processingUser === user.id}
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
        </div>

        {/* Modal de seleção de status para aprovação */}
        {userToApprove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Aprovar Usuário</h3>
                <button 
                  onClick={cancelApprovalProcess}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Close />
                </button>
              </div>
              
              <p className="mb-4 text-sm text-gray-600">
                Selecione o status inicial do usuário:
              </p>
              
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
              >
                <option value="">Selecione um status...</option>
                {statusOptions.map(option => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelApprovalProcess}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={completeApproval}
                  disabled={!selectedStatus || processingUser === userToApprove}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-md text-white transition-colors disabled:bg-primary-400"
                >
                  {processingUser === userToApprove ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </div>
                  ) : (
                    'Aprovar Usuário'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 