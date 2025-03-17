'use client';

import { useState } from 'react';
import { Search, Edit, CheckCircle, Delete, Close } from '@mui/icons-material';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import ModalRegistrarPagamento from './ModalRegistrarPagamento';

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
  
  // Filtrar cobranças
  const cobrancasFiltradas = cobrancas.filter((cobranca) => {
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Integrante
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cobrancasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma cobrança encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                cobrancasFiltradas.map((cobranca) => (
                  <tr key={cobranca.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cobranca.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cobranca.integrante}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarValor(cobranca.valor)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarMes(cobranca.mesVencimento)}/{cobranca.anoVencimento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {cobranca.status !== 'Pago' && (
                          <>
                            <button
                              onClick={() => onEditarCobranca(cobranca.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit fontSize="small" />
                            </button>
                            <button
                              onClick={() => handleMarcarComoPago(cobranca.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como Pago"
                            >
                              <CheckCircle fontSize="small" />
                            </button>
                          </>
                        )}
                        {onExcluirCobranca && (
                          <button
                            onClick={() => handleExcluirCobranca(cobranca.id, cobranca.cobrancaId)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir Cobrança"
                          >
                            <Delete fontSize="small" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
} 