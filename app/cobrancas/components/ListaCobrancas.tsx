'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, CheckCircle, Delete, Close, KeyboardArrowDown, KeyboardArrowUp, WhatsApp } from '@mui/icons-material';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import ModalRegistrarPagamento from './ModalRegistrarPagamento';
import ModalEnviarMensagemWhatsApp from './ModalEnviarMensagemWhatsApp';
import { Tooltip, IconButton } from '@mui/material';
import { WhatsAppService } from '@/services/whatsapp';
import React from 'react';

interface Cobranca {
  id: string;
  cobrancaId: string;
  nome: string;
  valor: number;
  status: string;
  integrante: string;
  integranteId: string;
  mesVencimento: number;
  anoVencimento: number;
  emAtraso: boolean;
  whatsapp_number?: string | null;
}

interface Integrante {
  id: string;
  name: string;
  status?: string;
  email?: string;
  nickname?: string;
}

interface ListaCobrancasProps {
  cobrancas: Cobranca[];
  integrantes: Integrante[];
  onEditarCobranca: (id: string) => void;
  onExcluirCobranca?: (id: string, cobrancaId: string) => void;
  supabase: SupabaseClient<Database>;
  onUpdate: () => void;
}

// Interface para cobranças agrupadas
interface CobrancaAgrupada {
  nome: string;
  valorTotal: number;
  mesVencimento: number;
  anoVencimento: number;
  status: 'Pago' | 'Em Atraso' | 'Pendente';
  cobrancas: Cobranca[];
  expandido: boolean;
}

export default function ListaCobrancas({ 
  cobrancas,
  integrantes,
  onEditarCobranca,
  onExcluirCobranca,
  supabase,
  onUpdate
}: ListaCobrancasProps) {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroIntegrante, setFiltroIntegrante] = useState<string>('');
  const [filtroNome, setFiltroNome] = useState<string>('');
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<string | null>(null);
  const [modalRegistrarPagamentoAberto, setModalRegistrarPagamentoAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [cobrancaParaExcluir, setCobrancaParaExcluir] = useState<{id: string, cobrancaId: string} | null>(null);
  const [gruposExpandidos, setGruposExpandidos] = useState<Record<string, boolean>>({});
  const [cobrancaSelecionadaWhatsApp, setCobrancaSelecionadaWhatsApp] = useState<Cobranca | null>(null);
  const [modalWhatsAppAberto, setModalWhatsAppAberto] = useState(false);
  const [whatsappEnviado, setWhatsappEnviado] = useState<Set<string>>(new Set());
  
  const whatsappService = new WhatsAppService();
  
  // Filtrar cobranças usando useMemo para evitar recálculos desnecessários
  const cobrancasFiltradas = useMemo(() => {
    return cobrancas.filter((cobranca) => {
      // Filtro por status
      if (filtroStatus === 'pago' && cobranca.status !== 'Pago') return false;
      if (filtroStatus === 'pendente' && cobranca.status !== 'Pendente') return false;
      if (filtroStatus === 'atrasado' && !cobranca.emAtraso) return false;
      
      // Filtro por integrante
      if (filtroIntegrante && cobranca.integranteId !== filtroIntegrante) return false;
      
      // Filtro por nome da cobrança
      if (filtroNome && !cobranca.nome.toLowerCase().includes(filtroNome.toLowerCase())) return false;
      
      return true;
    });
  }, [cobrancas, filtroStatus, filtroIntegrante, filtroNome]);
  
  // Agrupar cobranças por nome - também usando useMemo
  const gruposCobrancas = useMemo(() => {
    // Criar um mapa para agrupar as cobranças por nome
    const grupos: Record<string, Cobranca[]> = {};
    
    // Agrupar as cobranças por nome
    cobrancasFiltradas.forEach(cobranca => {
      if (!grupos[cobranca.nome]) {
        grupos[cobranca.nome] = [];
      }
      grupos[cobranca.nome].push(cobranca);
    });
    
    // Converter o mapa em um array de CobrancaAgrupada
    return Object.entries(grupos).map(([nome, cobranças]) => {
      // Calcular valor total
      const valorTotal = cobranças.reduce((total, c) => total + c.valor, 0);
      
      // Determinar status do grupo (Em Atraso > Pendente > Pago)
      let status: 'Pago' | 'Em Atraso' | 'Pendente' = 'Pago';
      
      // Se alguma cobrança estiver em atraso, o grupo está em atraso
      if (cobranças.some(c => c.emAtraso)) {
        status = 'Em Atraso';
      } 
      // Se não tiver atraso, mas alguma cobrança estiver pendente, o grupo está pendente
      else if (cobranças.some(c => c.status === 'Pendente')) {
        status = 'Pendente';
      }
      
      // Pegar mês e ano de vencimento da primeira cobrança
      // (assumindo que todas as cobranças no mesmo grupo têm o mesmo vencimento)
      const mesVencimento = cobranças[0].mesVencimento;
      const anoVencimento = cobranças[0].anoVencimento;
      
      return {
        nome,
        valorTotal,
        mesVencimento,
        anoVencimento,
        status,
        cobrancas: cobranças,
        expandido: gruposExpandidos[nome] || false // Usar estado separado para controlar expansão
      };
    });
  }, [cobrancasFiltradas, gruposExpandidos]);
  
  // Alternar expansão do grupo
  const alternarExpansao = (nome: string) => {
    setGruposExpandidos(prev => ({
      ...prev,
      [nome]: !prev[nome]
    }));
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
    
    return meses[mes - 1];
  };

  const handleMarcarComoPago = (cobrancaId: string) => {
    setCobrancaSelecionada(cobrancaId);
    setModalRegistrarPagamentoAberto(true);
  };

  const handleRegistroPagamentoSucesso = () => {
    setModalRegistrarPagamentoAberto(false);
    setCobrancaSelecionada(null);
    onUpdate();
  };

  const handleExcluirCobranca = (id: string, cobrancaId: string) => {
    setCobrancaParaExcluir({ id, cobrancaId });
    setModalConfirmacaoAberto(true);
  };

  const confirmarExclusao = () => {
    if (cobrancaParaExcluir && onExcluirCobranca) {
      onExcluirCobranca(cobrancaParaExcluir.id, cobrancaParaExcluir.cobrancaId);
    }
    setModalConfirmacaoAberto(false);
    setCobrancaParaExcluir(null);
  };

  const handleEnviarWhatsApp = async (cobranca: Cobranca) => {
    const cobrancaComWhatsApp = {
      ...cobranca,
      whatsapp_number: null // Será buscado do perfil
    };
    setCobrancaSelecionadaWhatsApp(cobrancaComWhatsApp);
    setModalWhatsAppAberto(true);
  };

  const handleConfirmarEnvioWhatsApp = async (mensagem: string) => {
    if (!cobrancaSelecionadaWhatsApp) return;

    try {
      // Buscar o whatsapp_number do integrante
      const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('id', cobrancaSelecionadaWhatsApp.integranteId)
        .single();

      if (error) throw error;

      const whatsapp_number = data?.whatsapp_number;
      if (whatsapp_number) {
        await whatsappService.sendTestMessage(
          whatsapp_number,
          mensagem
        );
        
        // Marcar como enviado
        setWhatsappEnviado(new Set([...Array.from(whatsappEnviado), cobrancaSelecionadaWhatsApp.id]));
      } else {
        throw new Error('Número de WhatsApp não encontrado');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };
  
  return (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="atrasado">Em Atraso</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Integrante</label>
            <select
              value={filtroIntegrante}
              onChange={(e) => setFiltroIntegrante(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {integrantes.map((integrante) => (
                <option key={integrante.id} value={integrante.id}>
                  {integrante.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Cobrança</label>
            <div className="relative">
              <input
                type="text"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" fontSize="small" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de cobranças */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notificação
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gruposCobrancas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma cobrança encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                gruposCobrancas.map((grupo) => (
                  <React.Fragment key={grupo.nome}>
                    {/* Linha do grupo */}
                    <tr 
                      className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => alternarExpansao(grupo.nome)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                        {grupo.expandido ? 
                          <KeyboardArrowUp className="mr-1 text-gray-500" fontSize="small" /> : 
                          <KeyboardArrowDown className="mr-1 text-gray-500" fontSize="small" />
                        }
                        {grupo.nome}
                        <span className="ml-2 text-xs text-gray-500">
                          ({grupo.cobrancas.length} {grupo.cobrancas.length === 1 ? 'integrante' : 'integrantes'})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatarValor(grupo.valorTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatarMes(grupo.mesVencimento)}/{grupo.anoVencimento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          grupo.status === 'Pago' 
                            ? 'bg-green-100 text-green-800' 
                            : grupo.status === 'Em Atraso' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {grupo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Coluna vazia para manter alinhamento */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Não há ações para o grupo, apenas para as cobranças individuais */}
                      </td>
                    </tr>
                    
                    {/* Linhas das cobranças individuais (quando expandidas) */}
                    {grupo.expandido && grupo.cobrancas.map((cobranca) => (
                      <tr key={cobranca.id} className="bg-white hover:bg-blue-50">
                        <td className="px-6 py-3 pl-12 whitespace-nowrap text-sm text-gray-700 border-l-4 border-blue-200">
                          <span className="font-medium">{cobranca.integrante}</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatarValor(cobranca.valor)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatarMes(cobranca.mesVencimento)}/{cobranca.anoVencimento}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            cobranca.status === 'Pago' 
                              ? 'bg-green-100 text-green-800' 
                              : cobranca.emAtraso 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cobranca.status === 'Pago' 
                              ? 'Pago' 
                              : cobranca.emAtraso 
                                ? 'Em Atraso' 
                                : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                          <Tooltip title={
                            whatsappEnviado.has(cobranca.id)
                              ? "Mensagem já enviada"
                              : cobranca.status !== 'Pendente'
                              ? "Disponível apenas para cobranças pendentes"
                              : "Enviar notificação para WhatsApp"
                          }>
                            <span>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEnviarWhatsApp(cobranca);
                                }}
                                disabled={cobranca.status !== 'Pendente' || whatsappEnviado.has(cobranca.id)}
                                color={whatsappEnviado.has(cobranca.id) ? "success" : "default"}
                              >
                                <WhatsApp />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {cobranca.status !== 'Pago' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditarCobranca(cobranca.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Editar"
                                >
                                  <Edit fontSize="small" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarcarComoPago(cobranca.id);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Marcar como Pago"
                                >
                                  <CheckCircle fontSize="small" />
                                </button>
                              </>
                            )}
                            {onExcluirCobranca && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExcluirCobranca(cobranca.id, cobranca.cobrancaId);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir Cobrança"
                              >
                                <Delete fontSize="small" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {modalConfirmacaoAberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
              onClick={() => setModalConfirmacaoAberto(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              {/* Botão Fechar */}
              <button
                onClick={() => setModalConfirmacaoAberto(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <Close fontSize="small" />
              </button>

              {/* Título */}
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirmar Exclusão
              </h3>

              {/* Conteúdo */}
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.
                </p>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  onClick={() => setModalConfirmacaoAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  onClick={confirmarExclusao}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Pagamento */}
      {cobrancaSelecionada && (
        <ModalRegistrarPagamento
          open={modalRegistrarPagamentoAberto}
          onClose={() => {
            setModalRegistrarPagamentoAberto(false);
            setCobrancaSelecionada(null);
          }}
          cobrancaId={cobrancaSelecionada}
          supabase={supabase}
          onSuccess={handleRegistroPagamentoSucesso}
        />
      )}

      {cobrancaSelecionadaWhatsApp && (
        <ModalEnviarMensagemWhatsApp
          open={modalWhatsAppAberto}
          onClose={() => {
            setModalWhatsAppAberto(false);
            setCobrancaSelecionadaWhatsApp(null);
          }}
          cobranca={cobrancaSelecionadaWhatsApp}
          onConfirm={handleConfirmarEnvioWhatsApp}
        />
      )}
    </div>
  );
} 