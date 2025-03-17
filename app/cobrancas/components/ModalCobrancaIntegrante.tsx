'use client';

import { useState, useEffect } from 'react';
import { Close, CheckCircle, Payment, Edit, Save } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Parcela {
  id: string;
  cobranca_id: string;
  numero_parcela: number;
  mes_vencimento: number;
  ano_vencimento: number;
  valor: number;
}

interface CobrancaIntegrante {
  id: string;
  cobranca_id: string;
  integrante_id: string;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  forma_pagamento_id?: string;
  data_pagamento?: string;
  cobranca?: {
    id: string;
    nome: string;
    valor: number;
    mes_vencimento: number;
    ano_vencimento: number;
    is_parcelado: boolean;
    parcelas?: number;
  };
  integrante?: {
    nome: string;
    email?: string;
  };
}

interface ModalCobrancaIntegranteProps {
  supabase: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  cobrancaIntegranteId: string;
}

export default function ModalCobrancaIntegrante({
  supabase,
  isOpen,
  onClose,
  onSave,
  cobrancaIntegranteId
}: ModalCobrancaIntegranteProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cobrancaIntegrante, setCobrancaIntegrante] = useState<CobrancaIntegrante | null>(null);
  const [editandoCobranca, setEditandoCobranca] = useState(false);
  const [valorCobranca, setValorCobranca] = useState(0);
  const [nomeCobranca, setNomeCobranca] = useState('');
  const [mesVencimento, setMesVencimento] = useState(1);
  const [anoVencimento, setAnoVencimento] = useState(new Date().getFullYear());
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [parcelasEditadas, setParcelasEditadas] = useState<Parcela[]>([]);
  
  // Reinicializar estado quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      console.log('Modal fechado, reinicializando estado');
      setCobrancaIntegrante(null);
      setLoading(true);
      setEditandoCobranca(false);
      setNomeCobranca('');
      setValorCobranca(0);
      setMesVencimento(new Date().getMonth() + 1);
      setAnoVencimento(new Date().getFullYear());
      setParcelas([]);
      setParcelasEditadas([]);
    }
  }, [isOpen]);
  
  // Carregar dados da cobrança do integrante
  useEffect(() => {
    const carregarDados = async () => {
      if (!isOpen || !cobrancaIntegranteId) {
        console.log('Modal não está aberto ou ID não fornecido:', { isOpen, cobrancaIntegranteId });
        return;
      }
      
      setLoading(true);
      try {
        console.log('Carregando dados da cobrança do integrante:', cobrancaIntegranteId);
        
        // Carregar dados da cobrança do integrante
        const { data: cobrancaData, error: cobrancaError } = await supabase
          .from('cobranca_integrantes')
          .select(`
            *,
            cobrancas (
              id,
              nome,
              valor,
              mes_vencimento,
              ano_vencimento,
              is_parcelado,
              parcelas
            ),
            profiles (
              id,
              name,
              email
            )
          `)
          .eq('id', cobrancaIntegranteId)
          .single();
        
        if (cobrancaError) {
          console.error('Erro ao carregar cobrança:', cobrancaError.message || 'Erro desconhecido');
          return;
        }
        
        if (cobrancaData) {
          console.log('Dados carregados:', cobrancaData);
          
          // Adaptar os dados para o formato esperado pelo componente
          const dadosAdaptados = {
            ...cobrancaData,
            integrante: {
              nome: cobrancaData.profiles?.name || '',
              email: cobrancaData.profiles?.email || ''
            }
          };
          
          setCobrancaIntegrante(dadosAdaptados);
          
          // Configurar dados da cobrança para edição
          if (cobrancaData.cobrancas) {
            console.log('Configurando dados da cobrança para edição:', cobrancaData.cobrancas);
            setNomeCobranca(cobrancaData.cobrancas.nome || '');
            setValorCobranca(cobrancaData.cobrancas.valor || 0);
            setMesVencimento(cobrancaData.cobrancas.mes_vencimento || 1);
            setAnoVencimento(cobrancaData.cobrancas.ano_vencimento || new Date().getFullYear());
            
            // Carregar parcelas se for parcelado
            if (cobrancaData.cobrancas.is_parcelado) {
              const { data: parcelasData, error: parcelasError } = await supabase
                .from('cobranca_parcelas')
                .select('*')
                .eq('cobranca_id', cobrancaData.cobrancas.id)
                .order('numero_parcela');
              
              if (parcelasError) {
                console.error('Erro ao carregar parcelas:', parcelasError.message || 'Erro desconhecido');
              } else if (parcelasData && parcelasData.length > 0) {
                console.log('Parcelas carregadas:', parcelasData);
                setParcelas(parcelasData);
                setParcelasEditadas(parcelasData);
              }
            }
          }
        }
        
        // Não precisamos mais carregar formas de pagamento, pois o campo Status foi removido
        
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error?.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [supabase, isOpen, cobrancaIntegranteId]);
  
  // Atualizar parcela específica
  const atualizarParcela = (index: number, campo: keyof Parcela, valor: any) => {
    const novasParcelas = [...parcelasEditadas];
    novasParcelas[index] = {
      ...novasParcelas[index],
      [campo]: valor
    };
    setParcelasEditadas(novasParcelas);
  };
  
  // Verificar se a soma das parcelas é igual ao valor total
  const validarParcelas = () => {
    if (parcelasEditadas.length === 0) return true;
    
    const somaValores = parcelasEditadas.reduce((total, parcela) => total + parcela.valor, 0);
    return Math.abs(somaValores - valorCobranca) < 0.01; // Tolerância para arredondamentos
  };
  
  // Salvar alterações
  const salvarAlteracoes = async () => {
    if (!cobrancaIntegrante) return;
    
    setSaving(true);
    try {
      // Salvar alterações na cobrança se estiver editando
      if (editandoCobranca) {
        // Validar parcelas
        if (parcelasEditadas.length > 0 && !validarParcelas()) {
          alert('A soma dos valores das parcelas deve ser igual ao valor total da cobrança.');
          setSaving(false);
          return;
        }
        
        // Verificar se temos o ID da cobrança
        const cobrancaId = cobrancaIntegrante.cobranca?.id || cobrancaIntegrante.cobranca_id;
        
        if (!cobrancaId) {
          console.error('ID da cobrança não encontrado');
          alert('Erro ao identificar a cobrança. Tente novamente.');
          setSaving(false);
          return;
        }
        
        console.log('Atualizando cobrança ID:', cobrancaId);
        
        // Atualizar cobrança
        const { error: cobrancaError } = await supabase
          .from('cobrancas')
          .update({
            nome: nomeCobranca,
            valor: valorCobranca,
            mes_vencimento: mesVencimento,
            ano_vencimento: anoVencimento,
            updated_at: new Date().toISOString()
          })
          .eq('id', cobrancaId);
        
        if (cobrancaError) {
          console.error('Erro ao atualizar cobrança:', cobrancaError.message || 'Erro desconhecido');
          alert('Erro ao atualizar cobrança. Tente novamente.');
          setSaving(false);
          return;
        }
        
        // Atualizar parcelas se existirem
        if (parcelasEditadas.length > 0) {
          for (const parcela of parcelasEditadas) {
            console.log('Atualizando parcela ID:', parcela.id);
            const { error: parcelaError } = await supabase
              .from('cobranca_parcelas')
              .update({
                valor: parcela.valor,
                mes_vencimento: parcela.mes_vencimento,
                ano_vencimento: parcela.ano_vencimento
              })
              .eq('id', parcela.id);
            
            if (parcelaError) {
              console.error('Erro ao atualizar parcela:', parcelaError.message || 'Erro desconhecido');
              alert('Erro ao atualizar parcelas. Tente novamente.');
              setSaving(false);
              return;
            }
          }
        }
      }
      
      // Não atualizamos mais o status da cobrança
      
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar alterações:', error?.message || 'Erro desconhecido');
      alert('Ocorreu um erro ao salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };
  
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
  
  // Obter anos para seleção
  const getAnos = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    
    for (let i = anoAtual - 1; i <= anoAtual + 5; i++) {
      anos.push(i);
    }
    
    return anos;
  };
  
  // Resetar o estado de edição quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      setEditandoCobranca(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Editar Detalhes da Cobrança
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={saving}
          >
            <Close />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : cobrancaIntegrante ? (
            <div className="space-y-6">
              {/* Informações da cobrança */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Detalhes da Cobrança</h3>
                  <button 
                    onClick={() => setEditandoCobranca(!editandoCobranca)}
                    className="text-blue-600 hover:text-blue-800"
                    title={editandoCobranca ? "Cancelar edição" : "Editar cobrança"}
                  >
                    {editandoCobranca ? <Close fontSize="small" /> : <Edit fontSize="small" />}
                  </button>
                </div>
                
                {editandoCobranca ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nome da Cobrança
                      </label>
                      <input
                        type="text"
                        value={nomeCobranca}
                        onChange={(e) => setNomeCobranca(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor (R$)
                      </label>
                      <input
                        type="number"
                        value={valorCobranca}
                        onChange={(e) => setValorCobranca(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Mês de Vencimento
                        </label>
                        <select
                          value={mesVencimento}
                          onChange={(e) => setMesVencimento(parseInt(e.target.value))}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                            <option key={mes} value={mes}>
                              {formatarMes(mes)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ano de Vencimento
                        </label>
                        <select
                          value={anoVencimento}
                          onChange={(e) => setAnoVencimento(parseInt(e.target.value))}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {getAnos().map((ano) => (
                            <option key={ano} value={ano}>
                              {ano}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Parcelas (se existirem) */}
                    {parcelasEditadas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Parcelas</h4>
                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Parcela
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Vencimento
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                  Valor
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {parcelasEditadas.map((parcela, index) => (
                                <tr key={parcela.id}>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {parcela.numero_parcela}/{parcelasEditadas.length}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                    <div className="flex space-x-1">
                                      <select
                                        value={parcela.mes_vencimento}
                                        onChange={(e) => atualizarParcela(index, 'mes_vencimento', parseInt(e.target.value))}
                                        className="p-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                          <option key={mes} value={mes}>
                                            {formatarMes(mes).substring(0, 3)}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={parcela.ano_vencimento}
                                        onChange={(e) => atualizarParcela(index, 'ano_vencimento', parseInt(e.target.value))}
                                        className="p-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      >
                                        {getAnos().map((ano) => (
                                          <option key={ano} value={ano}>
                                            {ano}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                    <input
                                      type="number"
                                      value={parcela.valor}
                                      onChange={(e) => atualizarParcela(index, 'valor', parseFloat(e.target.value) || 0)}
                                      className="p-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                </tr>
                              ))}
                              {/* Linha de total */}
                              <tr className="bg-gray-50">
                                <td colSpan={2} className="px-3 py-2 text-xs font-medium text-gray-700 text-right">
                                  Total:
                                </td>
                                <td className="px-3 py-2 text-xs font-medium text-gray-700">
                                  {formatarValor(parcelasEditadas.reduce((total, p) => total + p.valor, 0))}
                                  {!validarParcelas() && (
                                    <span className="ml-2 text-xs text-red-500">
                                      (Diferente do valor total)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Nome:</span>
                      <span className="text-sm font-medium">{nomeCobranca || cobrancaIntegrante.cobranca?.nome || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Valor:</span>
                      <span className="text-sm font-medium">{formatarValor(valorCobranca || cobrancaIntegrante.cobranca?.valor || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Vencimento:</span>
                      <span className="text-sm font-medium">
                        {formatarMes(mesVencimento || cobrancaIntegrante.cobranca?.mes_vencimento || 1)}/{anoVencimento || cobrancaIntegrante.cobranca?.ano_vencimento || new Date().getFullYear()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Integrante:</span>
                      <span className="text-sm font-medium">{cobrancaIntegrante.integrante?.nome || 'Não informado'}</span>
                    </div>
                    {parcelas.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-500 mb-1">Parcelas:</div>
                        <div className="bg-white border border-gray-200 rounded-md p-2 text-xs">
                          {parcelas.map((parcela) => (
                            <div key={parcela.id} className="flex justify-between mb-1 last:mb-0">
                              <span>{parcela.numero_parcela}/{parcelas.length} - {formatarMes(parcela.mes_vencimento).substring(0, 3)}/{parcela.ano_vencimento}</span>
                              <span className="font-medium">{formatarValor(parcela.valor)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Cobrança não encontrada.
            </div>
          )}
        </div>
        
        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvarAlteracoes}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            disabled={saving || loading || !cobrancaIntegrante || (editandoCobranca && parcelasEditadas.length > 0 && !validarParcelas())}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
} 