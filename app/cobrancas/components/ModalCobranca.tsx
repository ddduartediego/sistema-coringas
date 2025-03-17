'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Close, 
  CalendarMonth,
  Person,
  AttachMoney
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Interfaces
interface Integrante {
  id: string;
  name: string;
  email?: string;
  status?: string | null;
  is_admin?: boolean;
  avatar_url?: string;
}

interface Parcela {
  numero: number;
  mesVencimento: number;
  anoVencimento: number;
  valor: number;
}

interface Cobranca {
  id?: string;
  nome: string;
  valor: number;
  mesVencimento: number;
  anoVencimento: number;
  isParcelado: boolean;
  parcelas: number;
  integrantesSelecionados: string[];
}

interface ModalCobrancaProps {
  supabase: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  cobrancaId?: string;
}

export default function ModalCobranca({ 
  supabase, 
  isOpen, 
  onClose, 
  onSave,
  cobrancaId 
}: ModalCobrancaProps) {
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [integrantesAtivos, setIntegrantesAtivos] = useState<Integrante[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [statusOptions, setStatusOptions] = useState<{id: string, name: string}[]>([]);
  
  // Estado da cobrança
  const [cobranca, setCobranca] = useState<Cobranca>({
    nome: '',
    valor: 0,
    mesVencimento: new Date().getMonth() + 1,
    anoVencimento: new Date().getFullYear(),
    isParcelado: false,
    parcelas: 1,
    integrantesSelecionados: []
  });
  
  // Estado das parcelas
  const [detalhesParcelas, setDetalhesParcelas] = useState<Parcela[]>([]);
  
  // Carregar opções de status
  useEffect(() => {
    const carregarStatusOptions = async () => {
      try {
        console.log('Carregando opções de status...');
        
        const { data, error } = await supabase
          .from('config_status')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Erro ao carregar opções de status:', error);
          return;
        }
        
        console.log('Opções de status carregadas:', data);
        setStatusOptions(data || []);
      } catch (error) {
        console.error('Erro ao carregar opções de status:', error);
      }
    };
    
    if (isOpen) {
      carregarStatusOptions();
    }
  }, [isOpen, supabase]);
  
  // Carregar integrantes
  useEffect(() => {
    const carregarIntegrantes = async () => {
      try {
        setLoading(true);
        console.log('Carregando integrantes...');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, status, is_admin, avatar_url')
          .order('name');
        
        if (error) {
          console.error('Erro ao carregar integrantes:', error);
          return;
        }
        
        console.log('Integrantes carregados:', data?.length || 0);
        console.log('Exemplo de integrante:', data?.[0]);
        
        // Verificar se os status dos integrantes correspondem aos status disponíveis
        if (statusOptions.length > 0) {
          const statusDisponiveis = statusOptions.map(s => s.name);
          const integrantesComStatusInvalido = data?.filter(
            (integrante: Integrante) => integrante.status && !statusDisponiveis.includes(integrante.status)
          );
          
          if (integrantesComStatusInvalido && integrantesComStatusInvalido.length > 0) {
            console.warn(
              'Integrantes com status inválido:', 
              integrantesComStatusInvalido.map((i: Integrante) => `${i.name}: ${i.status}`)
            );
            
            // Corrigir os status inválidos para exibição local (não altera o banco de dados)
            const dadosCorrigidos = data.map((integrante: Integrante) => {
              if (integrante.status && !statusDisponiveis.includes(integrante.status)) {
                console.log(`Corrigindo status de ${integrante.name} de "${integrante.status}" para null`);
                return { ...integrante, status: null };
              }
              return integrante;
            });
            
            setIntegrantes(dadosCorrigidos || []);
            return; // Evita a atribuição abaixo
          }
        }
        
        setIntegrantes(data || []);
      } catch (error) {
        console.error('Erro ao carregar integrantes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      carregarIntegrantes();
    }
  }, [isOpen, supabase]);
  
  // Carregar dados da cobrança se estiver editando
  useEffect(() => {
    const carregarCobranca = async () => {
      if (!cobrancaId) return;
      
      setLoading(true);
      try {
        // Buscar dados da cobrança
        const { data: cobrancaData } = await supabase
          .from('cobrancas')
          .select('*')
          .eq('id', cobrancaId)
          .single();
        
        if (cobrancaData) {
          // Buscar integrantes relacionados a esta cobrança
          const { data: integrantesCobranca } = await supabase
            .from('cobranca_integrantes')
            .select('integrante_id')
            .eq('cobranca_id', cobrancaId);
          
          const integrantesSelecionados = integrantesCobranca 
            ? integrantesCobranca.map((item: any) => item.integrante_id) 
            : [];
          
          // Buscar parcelas se for parcelado
          let parcelas: Parcela[] = [];
          if (cobrancaData.is_parcelado) {
            const { data: parcelasData } = await supabase
              .from('cobranca_parcelas')
              .select('*')
              .eq('cobranca_id', cobrancaId)
              .order('numero_parcela');
            
            if (parcelasData) {
              parcelas = parcelasData.map((p: any) => ({
                numero: p.numero_parcela,
                mesVencimento: p.mes_vencimento,
                anoVencimento: p.ano_vencimento,
                valor: p.valor
              }));
            }
          }
          
          // Atualizar estado
          setCobranca({
            id: cobrancaData.id,
            nome: cobrancaData.nome,
            valor: cobrancaData.valor,
            mesVencimento: cobrancaData.mes_vencimento,
            anoVencimento: cobrancaData.ano_vencimento,
            isParcelado: cobrancaData.is_parcelado,
            parcelas: cobrancaData.parcelas || 1,
            integrantesSelecionados
          });
          
          if (parcelas.length > 0) {
            setDetalhesParcelas(parcelas);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados da cobrança:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && cobrancaId) {
      carregarCobranca();
    }
  }, [supabase, isOpen, cobrancaId]);
  
  // Gerar detalhes das parcelas automaticamente
  useEffect(() => {
    if (!cobranca.isParcelado || cobranca.parcelas <= 1) {
      setDetalhesParcelas([]);
      return;
    }
    
    // Calcular valor de cada parcela
    const valorParcela = Number((cobranca.valor / cobranca.parcelas).toFixed(2));
    // Ajustar a última parcela para compensar arredondamentos
    const valorUltimaParcela = Number((cobranca.valor - (valorParcela * (cobranca.parcelas - 1))).toFixed(2));
    
    // Gerar parcelas
    const parcelas: Parcela[] = [];
    let mesAtual = cobranca.mesVencimento;
    let anoAtual = cobranca.anoVencimento;
    
    for (let i = 1; i <= cobranca.parcelas; i++) {
      parcelas.push({
        numero: i,
        mesVencimento: mesAtual,
        anoVencimento: anoAtual,
        valor: i === cobranca.parcelas ? valorUltimaParcela : valorParcela
      });
      
      // Avançar para o próximo mês
      mesAtual++;
      if (mesAtual > 12) {
        mesAtual = 1;
        anoAtual++;
      }
    }
    
    setDetalhesParcelas(parcelas);
  }, [cobranca.isParcelado, cobranca.parcelas, cobranca.valor, cobranca.mesVencimento, cobranca.anoVencimento]);
  
  // Atualizar parcela específica
  const atualizarParcela = (index: number, campo: keyof Parcela, valor: any) => {
    const novasParcelas = [...detalhesParcelas];
    novasParcelas[index] = {
      ...novasParcelas[index],
      [campo]: valor
    };
    setDetalhesParcelas(novasParcelas);
  };
  
  // Manipular mudanças nos campos da cobrança
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCobranca({
        ...cobranca,
        [name]: checked
      });
    } else if (type === 'number') {
      setCobranca({
        ...cobranca,
        [name]: parseFloat(value) || 0
      });
    } else {
      setCobranca({
        ...cobranca,
        [name]: value
      });
    }
  };
  
  // Manipular seleção de integrantes
  const handleIntegranteSelecionado = (integranteId: string) => {
    const selecionados = [...cobranca.integrantesSelecionados];
    
    if (selecionados.includes(integranteId)) {
      // Remover da seleção
      const index = selecionados.indexOf(integranteId);
      selecionados.splice(index, 1);
    } else {
      // Adicionar à seleção
      selecionados.push(integranteId);
    }
    
    setCobranca({
      ...cobranca,
      integrantesSelecionados: selecionados
    });
  };
  
  // Selecionar todos os integrantes filtrados
  const selecionarTodos = () => {
    const ids = integrantesFiltrados.map(integrante => integrante.id);
    
    setCobranca({
      ...cobranca,
      integrantesSelecionados: ids
    });
  };
  
  // Remover seleção de todos os integrantes
  const removerTodos = () => {
    setCobranca({
      ...cobranca,
      integrantesSelecionados: []
    });
  };
  
  // Filtrar integrantes com base no status e busca
  const _filtrarIntegrantes = () => {
    // Criar uma cópia para não modificar o original
    let integrantesFiltrados = [...integrantes];
    
    // Obter status únicos sem usar Set para evitar erro de linter
    const statusUnicos = integrantesFiltrados
      .map(i => i.status)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    
    // Filtrar por status
    if (filtroStatus !== 'todos') {
      integrantesFiltrados = integrantesFiltrados.filter(integrante => {
        return integrante.status === filtroStatus;
      });
    }
    
    // Filtrar por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      integrantesFiltrados = integrantesFiltrados.filter(
        integrante => 
          integrante.name.toLowerCase().includes(termoBusca) || 
          (integrante.email && integrante.email.toLowerCase().includes(termoBusca))
      );
    }
    
    return integrantesFiltrados;
  };
  
  // Memoizar a lista de integrantes filtrados para evitar recálculos desnecessários
  const integrantesFiltrados = useMemo(() => {
    return _filtrarIntegrantes();
  }, [integrantes, filtroStatus, busca]);
  
  // Salvar cobrança
  const salvarCobranca = async () => {
    if (!cobranca.nome || cobranca.valor <= 0 || cobranca.integrantesSelecionados.length === 0) {
      alert('Preencha todos os campos obrigatórios e selecione pelo menos um integrante.');
      return;
    }
    
    // Verificar se as parcelas não ultrapassam a data de vencimento final
    if (cobranca.isParcelado && detalhesParcelas.length > 0) {
      const ultimaParcela = detalhesParcelas[detalhesParcelas.length - 1];
      if (
        (ultimaParcela.anoVencimento > cobranca.anoVencimento) || 
        (ultimaParcela.anoVencimento === cobranca.anoVencimento && 
         ultimaParcela.mesVencimento > cobranca.mesVencimento)
      ) {
        alert('A data da última parcela não pode ser superior ao vencimento da cobrança.');
        return;
      }
    }
    
    setSaving(true);
    
    try {
      // Caso esteja editando uma cobrança existente
      if (cobranca.id) {
        // Atualizar cobrança existente
        await supabase
          .from('cobrancas')
          .update({
            nome: cobranca.nome,
            valor: cobranca.valor,
            mes_vencimento: cobranca.mesVencimento,
            ano_vencimento: cobranca.anoVencimento,
            is_parcelado: cobranca.isParcelado,
            parcelas: cobranca.isParcelado ? cobranca.parcelas : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', cobranca.id);
          
        // Gerenciar parcelas se for parcelado
        if (cobranca.isParcelado) {
          // Remover parcelas existentes
          await supabase
            .from('cobranca_parcelas')
            .delete()
            .eq('cobranca_id', cobranca.id);
          
          // Inserir novas parcelas
          const parcelasParaInserir = detalhesParcelas.map(parcela => ({
            cobranca_id: cobranca.id,
            numero_parcela: parcela.numero,
            mes_vencimento: parcela.mesVencimento,
            ano_vencimento: parcela.anoVencimento,
            valor: parcela.valor
          }));
          
          await supabase
            .from('cobranca_parcelas')
            .insert(parcelasParaInserir);
        }
        
        // Gerenciar relações com integrantes
        // Remover relações existentes
        await supabase
          .from('cobranca_integrantes')
          .delete()
          .eq('cobranca_id', cobranca.id);
        
        // Inserir novas relações
        const relacoesParaInserir = cobranca.integrantesSelecionados.map(integranteId => ({
          cobranca_id: cobranca.id,
          integrante_id: integranteId,
          status: 'Pendente'
        }));
        
        await supabase
          .from('cobranca_integrantes')
          .insert(relacoesParaInserir);
      } else {
        // Criar uma cobrança para cada integrante selecionado
        for (const integranteId of cobranca.integrantesSelecionados) {
          console.log(`Criando cobrança para integrante ${integranteId}`);
          
          // 1. Criar a cobrança principal para este integrante
          const { data: novaCobranca, error: cobrancaError } = await supabase
            .from('cobrancas')
            .insert({
              nome: cobranca.nome,
              valor: cobranca.valor,
              mes_vencimento: cobranca.mesVencimento,
              ano_vencimento: cobranca.anoVencimento,
              is_parcelado: cobranca.isParcelado,
              parcelas: cobranca.isParcelado ? cobranca.parcelas : null
            })
            .select()
            .single();
          
          if (cobrancaError) {
            console.error(`Erro ao criar cobrança para integrante ${integranteId}:`, cobrancaError);
            continue;
          }
          
          const cobrancaId = novaCobranca.id;
          
          // 2. Criar parcelas para esta cobrança, se for parcelada
          if (cobranca.isParcelado && detalhesParcelas.length > 0) {
            const parcelasParaInserir = detalhesParcelas.map(parcela => ({
              cobranca_id: cobrancaId,
              numero_parcela: parcela.numero,
              mes_vencimento: parcela.mesVencimento,
              ano_vencimento: parcela.anoVencimento,
              valor: parcela.valor
            }));
            
            const { error: parcelasError } = await supabase
              .from('cobranca_parcelas')
              .insert(parcelasParaInserir);
            
            if (parcelasError) {
              console.error(`Erro ao criar parcelas para cobrança ${cobrancaId}:`, parcelasError);
            }
          }
          
          // 3. Criar a relação entre a cobrança e o integrante
          const { error: relacaoError } = await supabase
            .from('cobranca_integrantes')
            .insert({
              cobranca_id: cobrancaId,
              integrante_id: integranteId,
              status: 'Pendente'
            });
          
          if (relacaoError) {
            console.error(`Erro ao criar relação para cobrança ${cobrancaId} e integrante ${integranteId}:`, relacaoError);
          }
        }
      }
      
      // Finalizar
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cobrança:', error);
      alert('Ocorreu um erro ao salvar a cobrança. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Formatar mês para exibição
  const formatarMes = (mes: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return meses[mes - 1];
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
  
  // Atualizar lista de integrantes quando o filtro de status mudar
  useEffect(() => {
    console.log('Filtro de status alterado para:', filtroStatus);
    // A função filtrarIntegrantes será chamada automaticamente na renderização
  }, [filtroStatus]);
  
  // Função para obter a cor do status
  const getStatusColor = (status: string | null | undefined): string => {
    if (!status) return '#777777'; // Cinza para status indefinido
    
    // Cores padrão para status comuns
    switch(status.toLowerCase()) {
      case 'ativo':
        return '#4CAF50'; // Verde
      case 'inativo':
        return '#F44336'; // Vermelho
      case 'pendente':
        return '#FFC107'; // Amarelo
      case 'suspenso':
        return '#FF9800'; // Laranja
      default:
        return '#2196F3'; // Azul para outros status
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {cobrancaId ? 'Editar Cobrança' : 'Nova Cobrança'}
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
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Cobrança *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={cobranca.nome}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Mensalidade Junho"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    name="valor"
                    value={cobranca.valor}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              {/* Vencimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mês de Vencimento *
                  </label>
                  <select
                    name="mesVencimento"
                    value={cobranca.mesVencimento}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes}>
                        {formatarMes(mes)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano de Vencimento *
                  </label>
                  <select
                    name="anoVencimento"
                    value={cobranca.anoVencimento}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {getAnos().map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Parcelamento */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="isParcelado"
                    id="isParcelado"
                    checked={cobranca.isParcelado}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isParcelado" className="ml-2 block text-sm text-gray-900">
                    Cobrança Parcelada
                  </label>
                </div>
                
                {cobranca.isParcelado && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Parcelas *
                        </label>
                        <input
                          type="number"
                          name="parcelas"
                          value={cobranca.parcelas}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="2"
                          max="24"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Detalhes das parcelas */}
                    {detalhesParcelas.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Detalhes das Parcelas</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Parcela
                                  </th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vencimento
                                  </th>
                                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Valor
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {detalhesParcelas.map((parcela, index) => (
                                  <tr key={parcela.numero}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {parcela.numero}/{cobranca.parcelas}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex space-x-2">
                                        <select
                                          value={parcela.mesVencimento}
                                          onChange={(e) => atualizarParcela(index, 'mesVencimento', parseInt(e.target.value))}
                                          className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        >
                                          {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                                            <option key={mes} value={mes}>
                                              {formatarMes(mes)}
                                            </option>
                                          ))}
                                        </select>
                                        <select
                                          value={parcela.anoVencimento}
                                          onChange={(e) => atualizarParcela(index, 'anoVencimento', parseInt(e.target.value))}
                                          className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        >
                                          {getAnos().map((ano) => (
                                            <option key={ano} value={ano}>
                                              {ano}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      <input
                                        type="number"
                                        value={parcela.valor}
                                        onChange={(e) => atualizarParcela(index, 'valor', parseFloat(e.target.value) || 0)}
                                        className="p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-24"
                                        min="0"
                                        step="0.01"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Seleção de integrantes */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Selecionar Integrantes *</h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={selecionarTodos}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      type="button"
                      onClick={removerTodos}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      Remover Todos
                    </button>
                  </div>
                </div>
                
                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label htmlFor="filtroStatus" className="block text-sm font-medium text-gray-700">
                      Filtrar por Status
                    </label>
                    <select
                      id="filtroStatus"
                      name="filtroStatus"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                    >
                      <option value="todos">Todos os Status</option>
                      {statusOptions.map((status) => (
                        <option key={status.id} value={status.name}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Buscar Integrante
                    </label>
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Nome, email ou apelido..."
                    />
                  </div>
                </div>
                
                {/* Lista de integrantes */}
                <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : integrantesFiltrados.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      Nenhum integrante encontrado
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {integrantesFiltrados.map((integrante) => (
                        <div 
                          key={integrante.id}
                          className={`p-2 rounded-md border ${
                            cobranca.integrantesSelecionados.includes(integrante.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <label className="flex items-center space-x-3 py-2 px-2 hover:bg-gray-50 rounded-md cursor-pointer">
                            <input
                              type="checkbox"
                              className="form-checkbox h-5 w-5 text-blue-600"
                              checked={cobranca.integrantesSelecionados.includes(integrante.id)}
                              onChange={() => handleIntegranteSelecionado(integrante.id)}
                            />
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {integrante.avatar_url ? (
                                  <img 
                                    className="h-10 w-10 rounded-full object-cover" 
                                    src={integrante.avatar_url} 
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Person className="text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{integrante.name}</div>
                                <div className="text-sm text-gray-500">{integrante.email}</div>
                                <div className="flex items-center mt-1">
                                  <span 
                                    className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                                    style={{ 
                                      backgroundColor: `${getStatusColor(integrante.status)}20`, // 20% de opacidade
                                      color: getStatusColor(integrante.status),
                                      border: `1px solid ${getStatusColor(integrante.status)}` 
                                    }}
                                  >
                                    {integrante.status || 'Sem status'}
                                  </span>
                                  {integrante.is_admin && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {cobranca.integrantesSelecionados.length} integrante(s) selecionado(s)
                </div>
              </div>
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
            onClick={salvarCobranca}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            disabled={saving || loading}
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
} 