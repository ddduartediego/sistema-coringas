'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';
import { Add as AddIcon, Refresh, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AlertaPersonalizado from '../gamerun-admin/components/AlertaPersonalizado';

interface ConfiguracaoGame {
  id: string;
  tipo: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfiguracoesPage() {
  const supabase = createClientComponentClient<Database>();
  const [tiposGame, setTiposGame] = useState<ConfiguracaoGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<ConfiguracaoGame | null>(null);
  
  const [novoTipo, setNovoTipo] = useState({
    tipo: '',
    descricao: '',
    ativo: true
  });
  
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });

  // Carregar tipos de games
  const carregarTiposGame = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('configuracoes_game')
        .select('*')
        .order('tipo', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setTiposGame(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar tipos de game:', error);
      setAlerta({
        mensagem: `Erro ao carregar tipos de game: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    carregarTiposGame();
  }, []);

  // Abrir modal para adicionar/editar tipo
  const abrirModal = (tipo?: ConfiguracaoGame) => {
    if (tipo) {
      setTipoSelecionado(tipo);
      setNovoTipo({
        tipo: tipo.tipo,
        descricao: tipo.descricao,
        ativo: tipo.ativo
      });
    } else {
      setTipoSelecionado(null);
      setNovoTipo({
        tipo: '',
        descricao: '',
        ativo: true
      });
    }
    
    setModalAberto(true);
  };
  
  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setTipoSelecionado(null);
  };
  
  // Salvar tipo
  const salvarTipo = async () => {
    try {
      if (!novoTipo.tipo) {
        setAlerta({
          mensagem: 'O nome do tipo é obrigatório',
          tipo: 'erro',
          aberto: true
        });
        return;
      }
      
      if (tipoSelecionado) {
        // Atualizar tipo existente
        const { error } = await supabase
          .from('configuracoes_game')
          .update({
            tipo: novoTipo.tipo,
            descricao: novoTipo.descricao,
            ativo: novoTipo.ativo,
            updated_at: new Date().toISOString()
          })
          .eq('id', tipoSelecionado.id);
        
        if (error) throw error;
        
        setAlerta({
          mensagem: 'Tipo de game atualizado com sucesso',
          tipo: 'sucesso',
          aberto: true
        });
      } else {
        // Criar novo tipo
        const { error } = await supabase
          .from('configuracoes_game')
          .insert([{
            tipo: novoTipo.tipo,
            descricao: novoTipo.descricao,
            ativo: novoTipo.ativo
          }]);
        
        if (error) throw error;
        
        setAlerta({
          mensagem: 'Tipo de game adicionado com sucesso',
          tipo: 'sucesso',
          aberto: true
        });
      }
      
      fecharModal();
      carregarTiposGame();
    } catch (error: any) {
      console.error('Erro ao salvar tipo de game:', error);
      setAlerta({
        mensagem: `Erro ao salvar tipo de game: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    }
  };
  
  // Alternar status (ativo/inativo)
  const alternarStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('configuracoes_game')
        .update({ ativo: !ativo, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      setAlerta({
        mensagem: `Tipo de game ${ativo ? 'desativado' : 'ativado'} com sucesso`,
        tipo: 'sucesso',
        aberto: true
      });
      
      carregarTiposGame();
    } catch (error: any) {
      console.error('Erro ao alternar status:', error);
      setAlerta({
        mensagem: `Erro ao alternar status: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    }
  };
  
  // Excluir tipo
  const excluirTipo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de game?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('configuracoes_game')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAlerta({
        mensagem: 'Tipo de game excluído com sucesso',
        tipo: 'sucesso',
        aberto: true
      });
      
      carregarTiposGame();
    } catch (error: any) {
      console.error('Erro ao excluir tipo de game:', error);
      setAlerta({
        mensagem: `Erro ao excluir tipo de game: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    }
  };
  
  // Fechar alerta
  const fecharAlerta = () => {
    setAlerta(prev => ({ ...prev, aberto: false }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 rounded-lg bg-blue-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-gray-600">Gerencie as configurações do sistema</p>
      </div>
      
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tipos de Game</h2>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => carregarTiposGame()}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              <Refresh className="mr-2 h-5 w-5" />
              Atualizar
            </button>
            
            <button
              type="button"
              onClick={() => abrirModal()}
              className="flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none"
            >
              <AddIcon className="mr-2 h-5 w-5" />
              Novo Tipo
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : tiposGame.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">Nenhum tipo de game cadastrado</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tiposGame.map((tipo) => (
                  <tr key={tipo.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {tipo.tipo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tipo.descricao}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        tipo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => abrirModal(tipo)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EditIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => alternarStatus(tipo.id, tipo.ativo)}
                          className={`${tipo.ativo ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {tipo.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => excluirTipo(tipo.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <DeleteIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal para adicionar/editar tipo */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {tipoSelecionado ? 'Editar Tipo de Game' : 'Novo Tipo de Game'}
              </h3>
              <button
                type="button"
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Tipo
                </label>
                <input
                  type="text"
                  value={novoTipo.tipo}
                  onChange={(e) => setNovoTipo({ ...novoTipo, tipo: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Ex: Online, Presencial, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  value={novoTipo.descricao}
                  onChange={(e) => setNovoTipo({ ...novoTipo, descricao: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none"
                  placeholder="Descreva o tipo de game"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={novoTipo.ativo}
                  onChange={(e) => setNovoTipo({ ...novoTipo, ativo: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
                  Ativo
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={fecharModal}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarTipo}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
              >
                {tipoSelecionado ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AlertaPersonalizado
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        aberto={alerta.aberto}
        onClose={fecharAlerta}
      />
    </div>
  );
} 