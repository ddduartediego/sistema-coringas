'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  Close, 
  CalendarMonth,
  Person,
  AttachMoney,
  Search,
  Check,
  FilterList
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import AlertaPersonalizado from './AlertaPersonalizado';

// Interfaces
interface Integrante {
  id: string;
  name: string;
  email?: string;
  status?: string | null;
  is_admin?: boolean;
  avatar_url?: string;
}

interface Cobranca {
  id?: string;
  nome: string;
  valor: number;
  mesVencimento: number;
  anoVencimento: number;
  integrantesSelecionados: string[];
}

interface ModalCobrancaProps {
  supabase: SupabaseClient<Database>;
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
  const [cobranca, setCobranca] = useState<Cobranca>({
    nome: '',
    valor: 0,
    mesVencimento: new Date().getMonth() + 1,
    anoVencimento: new Date().getFullYear(),
    integrantesSelecionados: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [integrantesAtivos, setIntegrantesAtivos] = useState<Integrante[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroNome, setFiltroNome] = useState<string>('');
  const [statusOptions, setStatusOptions] = useState<{id: string, name: string}[]>([]);

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });
  
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
        if (statusOptions.length > 0 && data && Array.isArray(data)) {
          const statusDisponiveis = statusOptions.map(s => s.name);
          const integrantesComStatusInvalido = data.filter(
            (integrante) => integrante && 'status' in integrante && integrante.status && !statusDisponiveis.includes(integrante.status)
          );
          
          if (integrantesComStatusInvalido && integrantesComStatusInvalido.length > 0) {
            console.warn(
              'Integrantes com status inválido:', 
              integrantesComStatusInvalido.map((i) => `${i.name}: ${i.status}`)
            );
            
            // Corrigir os status inválidos para exibição local (não altera o banco de dados)
            const dadosCorrigidos = data.map((integrante) => {
              if (integrante && 'status' in integrante && integrante.status && !statusDisponiveis.includes(integrante.status)) {
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
          
          // Atualizar estado
          setCobranca({
            id: cobrancaData.id,
            nome: cobrancaData.nome,
            valor: cobrancaData.valor,
            mesVencimento: cobrancaData.mes_vencimento,
            anoVencimento: cobrancaData.ano_vencimento,
            integrantesSelecionados
          });
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
    if (filtroNome) {
      const termoBusca = filtroNome.toLowerCase();
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
  }, [integrantes, filtroStatus, filtroNome]);
  
  // Salvar cobrança
  const salvarCobranca = async () => {
    if (!cobranca.nome || cobranca.valor <= 0 || cobranca.integrantesSelecionados.length === 0) {
      setAlerta({
        mensagem: 'Preencha todos os campos obrigatórios e selecione pelo menos um integrante.',
        tipo: 'erro',
        aberto: true
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Se temos um ID, é uma edição
      if (cobrancaId) {
        // Atualizar a cobrança
        const { error: updateError } = await supabase
          .from('cobrancas')
          .update({
            nome: cobranca.nome,
            valor: cobranca.valor,
            mes_vencimento: cobranca.mesVencimento,
            ano_vencimento: cobranca.anoVencimento,
            updated_at: new Date().toISOString()
          })
          .eq('id', cobrancaId);
        
        if (updateError) {
          throw updateError;
        }
        
        // Mensagem de sucesso
        setAlerta({
          mensagem: 'Cobrança atualizada com sucesso!',
          tipo: 'sucesso',
          aberto: true
        });
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
              ano_vencimento: cobranca.anoVencimento
            })
            .select()
            .single();
          
          if (cobrancaError) {
            console.error(`Erro ao criar cobrança para integrante ${integranteId}:`, cobrancaError);
            continue;
          }
          
          const cobrancaId = novaCobranca.id;
          
          // 3. Criar a relação entre a cobrança e o integrante
          const { error: integranteError } = await supabase
            .from('cobranca_integrantes')
            .insert({
              cobranca_id: cobrancaId,
              integrante_id: integranteId,
              status: 'Pendente'
            });
          
          if (integranteError) {
            console.error(`Erro ao relacionar cobrança ${cobrancaId} com integrante ${integranteId}:`, integranteError);
          }
        }
        
        // Mensagem de sucesso
        setAlerta({
          mensagem: `Cobrança criada com sucesso para ${cobranca.integrantesSelecionados.length} integrante(s)!`,
          tipo: 'sucesso',
          aberto: true
        });
      }
      
      // Reset do formulário e callback
      setTimeout(() => {
        onSave();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao salvar cobrança:', error);
      setAlerta({
        mensagem: `Ocorreu um erro ao salvar: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
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
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Cabeçalho */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <AttachMoney className="mr-2 text-blue-600" />
              {cobrancaId ? 'Editar Cobrança' : 'Nova Cobrança'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
              disabled={saving}
              aria-label="Fechar"
            >
              <Close />
            </button>
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Informações básicas */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <CalendarMonth className="mr-2 text-blue-600" />
                    Informações Básicas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nome da Cobrança *
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={cobranca.nome}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ex: Mensalidade Junho"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Valor (R$) *
                      </label>
                      <input
                        type="number"
                        name="valor"
                        value={cobranca.valor}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0,00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Mês de Vencimento *
                      </label>
                      <select
                        name="mesVencimento"
                        value={cobranca.mesVencimento}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                          <option key={mes} value={mes}>
                            {formatarMes(mes)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ano de Vencimento *
                      </label>
                      <select
                        name="anoVencimento"
                        value={cobranca.anoVencimento}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
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
                </div>
                
                {/* Seleção de integrantes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Person className="mr-2 text-blue-600" />
                    Selecionar Integrantes *
                  </h3>
                  
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={selecionarTodos}
                        className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Selecionar Todos
                      </button>
                      <button
                        type="button"
                        onClick={removerTodos}
                        className="text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        Remover Todos
                      </button>
                    </div>
                    
                    <div className="px-3 py-1.5 bg-blue-50 rounded-md text-blue-600 text-sm font-medium">
                      {cobranca.integrantesSelecionados.length} integrante(s) selecionado(s)
                    </div>
                  </div>
                  
                  {/* Filtros */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label htmlFor="filtroStatus" className="block text-sm font-medium text-gray-700 mb-1">
                        Filtrar por Status
                      </label>
                      <div className="relative">
                        <select
                          id="filtroStatus"
                          name="filtroStatus"
                          className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg appearance-none"
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar Integrante
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={filtroNome}
                          onChange={(e) => setFiltroNome(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Nome, email ou apelido..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de integrantes */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg max-h-72 overflow-y-auto shadow-inner">
                    {loading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                      </div>
                    ) : integrantesFiltrados.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        <div className="mb-2 text-gray-400">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm">Nenhum integrante encontrado</p>
                        <p className="text-xs text-gray-400 mt-1">Tente mudar os filtros ou a busca</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {integrantesFiltrados.map((integrante) => (
                          <div 
                            key={integrante.id}
                            className={`rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md ${
                              cobranca.integrantesSelecionados.includes(integrante.id)
                                ? 'border-2 border-blue-500 bg-blue-50 shadow'
                                : 'border border-gray-200 bg-white hover:border-blue-300'
                            }`}
                            onClick={() => handleIntegranteSelecionado(integrante.id)}
                          >
                            <div className="flex items-center space-x-3 p-3">
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  {integrante.avatar_url ? (
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" 
                                      src={integrante.avatar_url} 
                                      alt=""
                                    />
                                  ) : (
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                      cobranca.integrantesSelecionados.includes(integrante.id)
                                        ? 'bg-blue-200 text-blue-800'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      <span className="text-lg font-semibold">
                                        {integrante.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  {cobranca.integrantesSelecionados.includes(integrante.id) && (
                                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{integrante.name}</p>
                                <p className="text-xs text-gray-500 truncate">{integrante.email}</p>
                                <div className="flex items-center mt-1 space-x-1">
                                  <span 
                                    className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                                    style={{ 
                                      backgroundColor: `${getStatusColor(integrante.status)}20`,
                                      color: getStatusColor(integrante.status),
                                      border: `1px solid ${getStatusColor(integrante.status)}` 
                                    }}
                                  >
                                    {integrante.status || 'Sem status'}
                                  </span>
                                  {integrante.is_admin && (
                                    <span className="px-1.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 border border-purple-200">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <input
                                  type="checkbox"
                                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  checked={cobranca.integrantesSelecionados.includes(integrante.id)}
                                  onChange={() => handleIntegranteSelecionado(integrante.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Rodapé */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarCobranca}
              className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center min-w-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${
                saving || loading 
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-blue-700 hover:shadow'
              }`}
              disabled={saving || loading}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Alerta Personalizado */}
      <AlertaPersonalizado
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        open={alerta.aberto}
        onClose={() => setAlerta(prev => ({ ...prev, aberto: false }))}
      />
    </>
  );
} 