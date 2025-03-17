'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import AppLayout from '@/components/layout/AppLayout';
import {
  People,
  SupervisorAccount,
  Person,
  Search,
  FilterList,
  Clear
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface IntegranteType {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  nickname: string;
  is_blood_donor: boolean;
  last_blood_donation: string | null;
}

interface EstatisticasType {
  total: number;
  porFuncao: { [key: string]: number };
  porStatus: { [key: string]: number };
}

export default function LiderancaPage() {
  const [loading, setLoading] = useState(true);
  const [integrantes, setIntegrantes] = useState<IntegranteType[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasType>({
    total: 0,
    porFuncao: {},
    porStatus: {}
  });
  const [filtros, setFiltros] = useState({
    busca: '',
    funcao: '',
    status: '',
    apenasDoadores: false,
    apenasDisponiveis: false
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Função para verificar se pode doar sangue
  const podeDoarSangue = (lastDonationDate: string | null) => {
    if (!lastDonationDate) return true;
    
    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return lastDonation <= threeMonthsAgo;
  };

  // Buscar dados dos integrantes
  useEffect(() => {
    async function fetchIntegrantes() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('name');

        if (error) throw error;

        // Calcular estatísticas
        const total = data.length;
        const porFuncao: { [key: string]: number } = {};
        const porStatus: { [key: string]: number } = {};

        data.forEach((integrante) => {
          // Contagem por função
          if (integrante.role) {
            porFuncao[integrante.role] = (porFuncao[integrante.role] || 0) + 1;
          }

          // Contagem por status
          if (integrante.status) {
            porStatus[integrante.status] = (porStatus[integrante.status] || 0) + 1;
          }
        });

        setEstatisticas({
          total,
          porFuncao,
          porStatus
        });

        setIntegrantes(data);
      } catch (error) {
        console.error('Erro ao buscar integrantes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchIntegrantes();
  }, [supabase]);

  // Filtrar integrantes
  const integrantesFiltrados = integrantes.filter((integrante) => {
    const matchBusca = integrante.name.toLowerCase().includes(filtros.busca.toLowerCase()) ||
                      integrante.nickname?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
                      integrante.email.toLowerCase().includes(filtros.busca.toLowerCase());

    const matchFuncao = !filtros.funcao || integrante.role === filtros.funcao;
    const matchStatus = !filtros.status || integrante.status === filtros.status;
    
    const matchDoador = !filtros.apenasDoadores || integrante.is_blood_donor;
    const matchDisponivel = !filtros.apenasDisponiveis || 
                          (integrante.is_blood_donor && 
                           (!integrante.last_blood_donation || podeDoarSangue(integrante.last_blood_donation)));

    return matchBusca && matchFuncao && matchStatus && matchDoador && matchDisponivel;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total de Integrantes */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center text-gray-600 mb-4">
              <People className="text-primary-600 mr-2" />
              <span className="text-sm font-medium">Total de Integrantes</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{estatisticas.total}</h3>
          </motion.div>

          {/* Funções */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center text-gray-600 mb-4">
              <SupervisorAccount className="text-primary-600 mr-2" />
              <span className="text-sm font-medium">Funções</span>
            </div>
            <div className="space-y-3">
              {Object.entries(estatisticas.porFuncao).map(([funcao, total]) => (
                <div key={funcao} className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{funcao}</span>
                  <span className="text-lg font-semibold text-primary-600">{total}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center text-gray-600 mb-4">
              <Person className="text-primary-600 mr-2" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <div className="space-y-3">
              {Object.entries(estatisticas.porStatus).map(([status, total]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{status}</span>
                  <span className="text-lg font-semibold text-primary-600">{total}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Filtros */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-col space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, apelido ou email..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Selects e Checkboxes */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <select
                  value={filtros.funcao}
                  onChange={(e) => setFiltros({ ...filtros, funcao: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Todas as funções</option>
                  {Object.keys(estatisticas.porFuncao).map((funcao) => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>

                <select
                  value={filtros.status}
                  onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Todos os status</option>
                  {Object.keys(estatisticas.porStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Filtros de Doação */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <label className="flex items-center space-x-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={filtros.apenasDoadores}
                    onChange={(e) => setFiltros({ ...filtros, apenasDoadores: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Apenas Doadores</span>
                </label>

                <label className="flex items-center space-x-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={filtros.apenasDisponiveis}
                    onChange={(e) => setFiltros({ ...filtros, apenasDisponiveis: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Disponíveis para Doar</span>
                </label>

                {(filtros.busca || filtros.funcao || filtros.status || filtros.apenasDoadores || filtros.apenasDisponiveis) && (
                  <button
                    onClick={() => setFiltros({ 
                      busca: '', 
                      funcao: '', 
                      status: '', 
                      apenasDoadores: false, 
                      apenasDisponiveis: false 
                    })}
                    className="px-4 py-3 text-gray-600 hover:text-gray-800 flex items-center justify-center rounded-xl hover:bg-gray-50 border border-gray-200 transition-all duration-200"
                  >
                    <Clear className="mr-2" />
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de integrantes */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Lista de Integrantes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">Nome</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apelido</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">Doador de Sangue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {integrantesFiltrados.map((integrante) => (
                    <tr key={integrante.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{integrante.name}</div>
                        <div className="text-sm text-gray-500">{integrante.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{integrante.nickname || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
                          {integrante.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${integrante.status === 'Veterano' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-blue-50 text-blue-700'}`}>
                          {integrante.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {integrante.is_blood_donor ? (
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
                              Sim
                            </span>
                            {integrante.last_blood_donation && podeDoarSangue(integrante.last_blood_donation) && (
                              <div className="text-xs text-green-600 mt-1 font-medium">
                                Pode doar novamente!
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-600">
                            Não
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
} 