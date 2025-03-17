'use client';

import { useState, useEffect } from 'react';
import { 
  Payment, 
  CheckCircle, 
  Warning, 
  Schedule,
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Parcela {
  id: string;
  cobranca_id: string;
  numero_parcela: number;
  mes_vencimento: number;
  ano_vencimento: number;
  valor: number;
}

interface CobrancaDB {
  id: string;
  nome: string;
  valor: number;
  mes_vencimento: number;
  ano_vencimento: number;
  is_parcelado: boolean;
  parcelas?: Parcela[];
}

interface CobrancaIntegranteDB {
  id: string;
  cobranca_id: string;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  data_pagamento?: string;
  cobrancas?: CobrancaDB;
}

interface Cobranca {
  id: string;
  cobranca_id: string;
  nome: string;
  valor: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  data_pagamento?: string;
  mes_vencimento: number;
  ano_vencimento: number;
  is_parcelado: boolean;
  parcelas?: Parcela[];
}

interface CobrancasIntegranteProps {
  supabase: any;
  userId: string;
}

export default function CobrancasIntegrante({ supabase, userId }: CobrancasIntegranteProps) {
  const [loading, setLoading] = useState(true);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [parcelasExpandidas, setParcelasExpandidas] = useState<string[]>([]);
  const [resumo, setResumo] = useState({
    total: 0,
    pagas: 0,
    pendentes: 0,
    atrasadas: 0
  });

  // Carregar cobranças do integrante
  useEffect(() => {
    const carregarCobrancas = async () => {
      try {
        setLoading(true);
        console.log('Carregando cobranças para o usuário:', userId);

        // Primeiro, vamos verificar se o usuário existe na tabela profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('user_id', userId)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          throw profileError;
        }

        console.log('Perfil encontrado:', profileData);
        
        const { data: cobrancasData, error } = await supabase
          .from('cobranca_integrantes')
          .select(`
            id,
            cobranca_id,
            status,
            data_pagamento,
            cobrancas (
              id,
              nome,
              valor,
              mes_vencimento,
              ano_vencimento,
              is_parcelado
            )
          `)
          .eq('integrante_id', profileData.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro na query:', error);
          throw error;
        }

        console.log('Cobranças encontradas:', cobrancasData?.length || 0);
        console.log('Dados das cobranças:', cobrancasData);

        if (cobrancasData) {
          // Buscar parcelas para cada cobrança que é parcelada
          const cobrancasComParcelas = await Promise.all(
            cobrancasData.map(async (item: CobrancaIntegranteDB) => {
              if (item.cobrancas?.is_parcelado) {
                console.log('Buscando parcelas para a cobrança:', item.cobranca_id);
                const { data: parcelasData, error: parcelasError } = await supabase
                  .from('cobranca_parcelas')
                  .select('*')
                  .eq('cobranca_id', item.cobranca_id)
                  .order('numero_parcela');

                if (parcelasError) {
                  console.error('Erro ao buscar parcelas:', parcelasError);
                  return item;
                }

                console.log('Parcelas encontradas:', parcelasData?.length || 0);
                return {
                  ...item,
                  cobrancas: {
                    ...item.cobrancas,
                    parcelas: parcelasData || []
                  }
                };
              }
              return item;
            })
          );

          // Processar cobranças
          const cobranças = cobrancasComParcelas.map((item: CobrancaIntegranteDB) => ({
            id: item.id,
            cobranca_id: item.cobranca_id,
            nome: item.cobrancas?.nome || '',
            valor: item.cobrancas?.valor || 0,
            status: item.status,
            data_pagamento: item.data_pagamento,
            mes_vencimento: item.cobrancas?.mes_vencimento || 1,
            ano_vencimento: item.cobrancas?.ano_vencimento || new Date().getFullYear(),
            is_parcelado: item.cobrancas?.is_parcelado || false,
            parcelas: item.cobrancas?.parcelas || []
          }));

          console.log('Cobranças processadas:', cobranças);
          setCobrancas(cobranças);

          // Calcular resumo
          const novoResumo = cobranças.reduce((acc: { total: number; pagas: number; pendentes: number; atrasadas: number }, cobranca: Cobranca) => {
            acc.total += cobranca.valor;
            if (cobranca.status === 'Pago') acc.pagas += cobranca.valor;
            else if (cobranca.status === 'Atrasado') acc.atrasadas += cobranca.valor;
            else acc.pendentes += cobranca.valor;
            return acc;
          }, { total: 0, pagas: 0, pendentes: 0, atrasadas: 0 });

          console.log('Resumo calculado:', novoResumo);
          setResumo(novoResumo);
        }
      } catch (error: any) {
        console.error('Erro ao carregar cobranças:', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      carregarCobrancas();
    } else {
      console.warn('userId não fornecido');
      setLoading(false);
    }
  }, [supabase, userId]);

  // Formatar valor para exibição
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Formatar mês para exibição
  const formatarMes = (mes: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes - 1] || 'Janeiro';
  };

  // Formatar data para exibição
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Alternar expansão das parcelas
  const toggleParcelas = (cobrancaId: string) => {
    setParcelasExpandidas(prev => 
      prev.includes(cobrancaId)
        ? prev.filter(id => id !== cobrancaId)
        : [...prev, cobrancaId]
    );
  };

  // Filtrar cobranças
  const cobrancasFiltradas = cobrancas.filter(cobranca => {
    if (filtroStatus === 'todos') return true;
    return cobranca.status.toLowerCase() === filtroStatus;
  });

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'bg-green-100 text-green-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pago':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Pendente':
        return <Schedule className="h-5 w-5 text-yellow-600" />;
      case 'Atrasado':
        return <Warning className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Minhas Cobranças</h2>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="todos">Todas</option>
          <option value="pago">Pagas</option>
          <option value="pendente">Pendentes</option>
          <option value="atrasado">Em Atraso</option>
        </select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Pago</p>
              <p className="text-xl font-bold text-green-800">{formatarValor(resumo.pagas)}</p>
            </div>
            <div className="bg-green-200 rounded-full p-2">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pendente</p>
              <p className="text-xl font-bold text-yellow-800">{formatarValor(resumo.pendentes)}</p>
            </div>
            <div className="bg-yellow-200 rounded-full p-2">
              <Schedule className="h-6 w-6 text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Em Atraso</p>
              <p className="text-xl font-bold text-red-800">{formatarValor(resumo.atrasadas)}</p>
            </div>
            <div className="bg-red-200 rounded-full p-2">
              <Warning className="h-6 w-6 text-red-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de cobranças */}
      <div className="space-y-4 mt-6">
        {cobrancasFiltradas.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <Payment className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Nenhuma cobrança encontrada</p>
            <p className="text-sm text-gray-500 mt-1">Não há cobranças para exibir com os filtros selecionados</p>
          </div>
        ) : (
          cobrancasFiltradas.map((cobranca) => (
            <motion.div
              key={cobranca.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Cabeçalho da cobrança */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      cobranca.status === 'Pago' ? 'bg-green-100' :
                      cobranca.status === 'Pendente' ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                      {getStatusIcon(cobranca.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{cobranca.nome}</h3>
                      <p className="text-sm text-gray-500">
                        Vencimento: {formatarMes(cobranca.mes_vencimento)}/{cobranca.ano_vencimento}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatarValor(cobranca.valor)}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(cobranca.status)}`}>
                      {cobranca.status}
                    </span>
                  </div>
                </div>

                {/* Data de pagamento se pago */}
                {cobranca.status === 'Pago' && cobranca.data_pagamento && (
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    Pago em: {formatarData(cobranca.data_pagamento)}
                  </p>
                )}

                {/* Botão para expandir parcelas */}
                {cobranca.is_parcelado && cobranca.parcelas && cobranca.parcelas.length > 0 && (
                  <button
                    onClick={() => toggleParcelas(cobranca.id)}
                    className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    {parcelasExpandidas.includes(cobranca.id) ? (
                      <>
                        <KeyboardArrowUp className="h-5 w-5" />
                        <span>Ocultar Parcelas</span>
                      </>
                    ) : (
                      <>
                        <KeyboardArrowDown className="h-5 w-5" />
                        <span>Ver Parcelas ({cobranca.parcelas.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Parcelas */}
              {cobranca.is_parcelado && 
               cobranca.parcelas && 
               cobranca.parcelas.length > 0 && 
               parcelasExpandidas.includes(cobranca.id) && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcela</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cobranca.parcelas.map((parcela) => (
                            <tr key={parcela.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {parcela.numero_parcela}/{cobranca.parcelas?.length}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {formatarMes(parcela.mes_vencimento)}/{parcela.ano_vencimento}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 text-right whitespace-nowrap">
                                {formatarValor(parcela.valor)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
} 