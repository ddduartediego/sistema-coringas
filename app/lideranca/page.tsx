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
  Clear,
  Visibility,
  GetApp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface IntegranteType {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  nickname: string;
  is_blood_donor: boolean;
  last_blood_donation: string | null;
  gender: string | null;
  camisa1_tamanho: string | null;
  camisa2_tamanho: string | null;
  camisa3_tamanho: string | null;
}

interface EstatisticasType {
  total: number;
  porFuncao: { [key: string]: number };
  porStatus: { [key: string]: number };
  doadores: {
    naoDoadores: number;
    doadores: number;
    podemDoar: number;
  };
  camisetas: {
    preenchido: number;
    incompleto: number;
  };
}

export default function LiderancaPage() {
  const [loading, setLoading] = useState(true);
  const [integrantes, setIntegrantes] = useState<IntegranteType[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasType>({
    total: 0,
    porFuncao: {},
    porStatus: {},
    doadores: {
      naoDoadores: 0,
      doadores: 0,
      podemDoar: 0
    },
    camisetas: {
      preenchido: 0,
      incompleto: 0
    }
  });
  const [filtros, setFiltros] = useState({
    busca: '',
    funcao: '',
    status: '',
    apenasDoadores: false,
    apenasDisponiveis: false,
    apenasPreenchidos: false
  });

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Função para verificar se pode doar sangue
  const podeDoarSangue = (lastDonationDate: string | null, gender: string | null) => {
    if (!lastDonationDate) return true;
    
    const lastDonation = new Date(lastDonationDate);
    const currentDate = new Date();
    
    // Regra diferente baseada no gênero
    if (gender === 'Masculino') {
      // 2 meses para homens
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return lastDonation <= twoMonthsAgo;
    } else {
      // 3 meses para mulheres e outros gêneros
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return lastDonation <= threeMonthsAgo;
    }
  };

  // Função para verificar o status da camiseta
  const verificarStatusCamiseta = (integrante: IntegranteType) => {
    return integrante.camisa1_tamanho && integrante.camisa2_tamanho ? 'Preenchido' : 'Incompleto';
  };

  // Função para exportar dados em CSV
  const exportarCSV = () => {
    // Criar o cabeçalho do CSV
    const headers = ['Nome', 'Apelido', 'Email', 'Tamanho Camisa 1', 'Tamanho Camisa 2', 'Tamanho Camisa Extra'];
    
    // Formatar os dados dos integrantes
    const csvData = integrantes.map(integrante => [
      integrante.name || 'Não preenchido',
      integrante.nickname || 'Não preenchido',
      integrante.email || 'Não preenchido',
      integrante.camisa1_tamanho || 'Não preenchido',
      integrante.camisa2_tamanho || 'Não preenchido',
      integrante.camisa3_tamanho || 'Não preenchido'
    ]);
    
    // Adicionar os cabeçalhos aos dados
    csvData.unshift(headers);
    
    // Converter os dados para o formato CSV
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Criar um objeto blob contendo o CSV
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Criar um link para download
    const link = document.createElement('a');
    
    // Converter o blob para URL
    const url = URL.createObjectURL(blob);
    
    // Configurar o link
    link.setAttribute('href', url);
    
    // Formatar a data para o nome do arquivo
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    
    // Definir o nome do arquivo
    link.setAttribute('download', `Lista_de_Integrantes_${dia}-${mes}-${ano}.csv`);
    
    // Anexar o link ao documento
    document.body.appendChild(link);
    
    // Clicar no link para iniciar o download
    link.click();
    
    // Remover o link do documento
    document.body.removeChild(link);
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
        const doadores = {
          naoDoadores: 0,
          doadores: 0,
          podemDoar: 0
        };
        const camisetas = {
          preenchido: 0,
          incompleto: 0
        };

        data.forEach((integrante) => {
          // Contagem por função
          if (integrante.role) {
            porFuncao[integrante.role] = (porFuncao[integrante.role] || 0) + 1;
          }

          // Contagem por status
          if (integrante.status) {
            porStatus[integrante.status] = (porStatus[integrante.status] || 0) + 1;
          }

          // Contagem de doadores
          if (integrante.is_blood_donor) {
            doadores.doadores++;
            if (podeDoarSangue(integrante.last_blood_donation, integrante.gender)) {
              doadores.podemDoar++;
            }
          } else {
            doadores.naoDoadores++;
          }
          
          // Contagem de status de camiseta
          if (integrante.camisa1_tamanho && integrante.camisa2_tamanho) {
            camisetas.preenchido++;
          } else {
            camisetas.incompleto++;
          }
        });

        setEstatisticas({
          total,
          porFuncao,
          porStatus,
          doadores,
          camisetas
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
                          (integrante.is_blood_donor && podeDoarSangue(integrante.last_blood_donation, integrante.gender));
    const matchCamiseta = !filtros.apenasPreenchidos || 
                          (integrante.camisa1_tamanho && integrante.camisa2_tamanho);

    return matchBusca && matchFuncao && matchStatus && matchDoador && matchDisponivel && matchCamiseta;
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
      <div className="px-4 pb-8">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total de Integrantes (com Status) */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center text-primary-600 mb-5">
              <People className="text-blue-600 mr-2" />
              <span className="text-blue-600 font-medium">Total de Integrantes</span>
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-5">{estatisticas.total}</h3>
            
            {/* Status integrado */}
            <div className="mt-2">
              <div className="flex items-center text-gray-600 mb-3">
                <Person className="text-blue-600 mr-2" />
                <span className="text-blue-600 font-medium">Status</span>
              </div>
              <div className="space-y-2">
                {Object.entries(estatisticas.porStatus).map(([status, total]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-700">{status}</span>
                    <span className="text-blue-600 font-semibold">{total}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Doadores */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center mb-5">
              <svg 
                className="w-6 h-6 text-red-600 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              <span className="text-red-600 font-medium">Doadores de Sangue</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Não Doadores</span>
                <span className="text-gray-600 font-semibold">{estatisticas.doadores.naoDoadores}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Doadores*</span>
                <span className="text-red-600 font-semibold">{estatisticas.doadores.doadores}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-xs">*Podem Doar</span>
                <span className="text-green-600 font-semibold">{estatisticas.doadores.podemDoar}</span>
              </div>
            </div>
          </motion.div>

          {/* Funções */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center text-gray-600 mb-5">
              <SupervisorAccount className="text-blue-600 mr-2" />
              <span className="text-blue-600 font-medium">Funções</span>
            </div>
            <div className="space-y-3">
              {Object.entries(estatisticas.porFuncao).map(([funcao, total]) => (
                <div key={funcao} className="flex justify-between items-center">
                  <span className="text-gray-700">{funcao}</span>
                  <span className="text-blue-600 font-semibold">{total}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status de Camisetas */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center text-gray-600 mb-5">
              <svg 
                className="w-6 h-6 text-blue-600 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"
                />
              </svg>
              <span className="text-blue-600 font-medium">Camisetas</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Preenchido</span>
                <span className="text-green-600 font-semibold">{estatisticas.camisetas.preenchido}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Incompleto</span>
                <span className="text-orange-600 font-semibold">{estatisticas.camisetas.incompleto}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filtros */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col space-y-4">
            {/* Busca */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, apelido ou email..."
                value={filtros.busca}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Selects */}
              <div className="flex flex-wrap items-center gap-3 min-w-[200px]">
                <div className="relative">
                  <select
                    value={filtros.funcao}
                    onChange={(e) => setFiltros({ ...filtros, funcao: e.target.value })}
                    className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm text-gray-700 font-medium hover:border-primary-300"
                  >
                    <option value="">Todas as funções</option>
                    {Object.keys(estatisticas.porFuncao).map((funcao) => (
                      <option key={funcao} value={funcao}>{funcao}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <FilterList className="h-5 w-5" />
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={filtros.status}
                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                    className="appearance-none w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm text-gray-700 font-medium hover:border-primary-300"
                  >
                    <option value="">Todos os status</option>
                    {Object.keys(estatisticas.porStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <FilterList className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtros.apenasDoadores}
                    onChange={(e) => setFiltros({ ...filtros, apenasDoadores: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">Apenas Doadores</span>
                </label>

                <label className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtros.apenasDisponiveis}
                    onChange={(e) => setFiltros({ ...filtros, apenasDisponiveis: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">Disponíveis para Doar</span>
                </label>

                <label className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filtros.apenasPreenchidos}
                    onChange={(e) => setFiltros({ ...filtros, apenasPreenchidos: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">Camisetas</span>
                </label>

                {(filtros.busca || filtros.funcao || filtros.status || filtros.apenasDoadores || filtros.apenasDisponiveis || filtros.apenasPreenchidos) && (
                  <button
                    onClick={() => setFiltros({ 
                      busca: '', 
                      funcao: '', 
                      status: '', 
                      apenasDoadores: false, 
                      apenasDisponiveis: false,
                      apenasPreenchidos: false
                    })}
                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 hover:text-gray-900"
                  >
                    <Clear className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </button>
                )}
                
                {/* Botão de exportação CSV */}
                <button
                  onClick={exportarCSV}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg border border-blue-600 transition-all duration-200"
                  title="Exportar lista para CSV"
                >
                  <GetApp className="w-4 h-4 mr-2" />
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lista de integrantes */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Lista de Integrantes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">Ações</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apelido</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho Camiseta</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">Doador de Sangue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {integrantesFiltrados.map((integrante) => (
                    <tr key={integrante.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/profile/${integrante.user_id}`} title="Acessar perfil do Integrante">
                          <button 
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors py-1 px-2 rounded-md hover:bg-blue-50"
                          >
                            <Visibility fontSize="small" className="mr-1" />
                            Ver Perfil
                          </button>
                        </Link>
                      </td>
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
                        {verificarStatusCamiseta(integrante)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {integrante.is_blood_donor ? (
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
                              Sim
                            </span>
                            {podeDoarSangue(integrante.last_blood_donation, integrante.gender) && (
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