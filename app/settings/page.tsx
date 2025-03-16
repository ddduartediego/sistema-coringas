'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import AppLayout from '@/components/layout/AppLayout';
import { Settings, Add, Delete, Edit, Save, Cancel } from '@mui/icons-material';

interface ConfigItem {
  id: string;
  name: string;
}

type ConfigType = 'status' | 'roles';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [statusItems, setStatusItems] = useState<ConfigItem[]>([]);
  const [roleItems, setRoleItems] = useState<ConfigItem[]>([]);
  const [activeTab, setActiveTab] = useState<ConfigType>('status');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Carregar dados
  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar status
        const { data: statusData, error: statusError } = await supabase
          .from('config_status')
          .select('*')
          .order('name');
          
        if (statusError) throw statusError;

        // Buscar funções
        const { data: rolesData, error: rolesError } = await supabase
          .from('config_roles')
          .select('*')
          .order('name');
          
        if (rolesError) throw rolesError;

        setStatusItems(statusData || []);
        setRoleItems(rolesData || []);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Obter lista ativa com base na aba
  const getActiveItems = () => {
    return activeTab === 'status' ? statusItems : roleItems;
  };

  // Definir lista ativa com base na aba
  const setActiveItems = (items: ConfigItem[]) => {
    if (activeTab === 'status') {
      setStatusItems(items);
    } else {
      setRoleItems(items);
    }
  };

  // Obter tabela ativa com base na aba
  const getActiveTable = () => {
    return activeTab === 'status' ? 'config_status' : 'config_roles';
  };

  // Iniciar edição
  const handleEditItem = (item: ConfigItem) => {
    setEditingItem(item.id);
    setItemName(item.name);
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingItem(null);
    setItemName('');
  };

  // Salvar item editado
  const handleSaveEdit = async () => {
    if (!itemName.trim() || !editingItem) return;
    
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from(getActiveTable())
        .update({ name: itemName.trim() })
        .eq('id', editingItem);
        
      if (error) throw error;
      
      const updatedItems = getActiveItems().map(item => 
        item.id === editingItem ? { ...item, name: itemName.trim() } : item
      );
      
      setActiveItems(updatedItems);
      setEditingItem(null);
      setItemName('');
      
      setMessage({
        type: 'success',
        text: 'Item atualizado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar item:', error);
      setMessage({
        type: 'error',
        text: `Erro ao atualizar item: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Adicionar novo item
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase
        .from(getActiveTable())
        .insert({ name: newItemName.trim() })
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedItems = [...getActiveItems(), data];
      setActiveItems(updatedItems);
      setNewItemName('');
      
      setMessage({
        type: 'success',
        text: 'Item adicionado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao adicionar item:', error);
      setMessage({
        type: 'error',
        text: `Erro ao adicionar item: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Excluir item
  const handleDeleteItem = async (id: string) => {
    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from(getActiveTable())
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      const updatedItems = getActiveItems().filter(item => item.id !== id);
      setActiveItems(updatedItems);
      
      setMessage({
        type: 'success',
        text: 'Item excluído com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao excluir item:', error);
      setMessage({
        type: 'error',
        text: `Erro ao excluir item: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMessage(null), 5000);
    }
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
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Settings className="text-primary-600 text-3xl mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Abas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                className={`px-6 py-3 font-medium ${activeTab === 'status' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('status')}
              >
                Status de Integrantes
              </button>
              <button
                className={`px-6 py-3 font-medium ${activeTab === 'roles' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('roles')}
              >
                Funções na Equipe
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {activeTab === 'status' ? 'Gerenciar Status' : 'Gerenciar Funções'}
              </h2>
              
              <div className="flex mb-4">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Novo ${activeTab === 'status' ? 'status' : 'função'}...`}
                  className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newItemName.trim() || isProcessing}
                  className="bg-primary-600 text-white px-4 py-2 rounded-r-md hover:bg-primary-700 disabled:opacity-70 flex items-center"
                >
                  <Add className="mr-1" />
                  Adicionar
                </button>
              </div>

              <div className="bg-gray-50 rounded-md border">
                <ul className="divide-y divide-gray-200">
                  {getActiveItems().length === 0 ? (
                    <li className="p-4 text-gray-500 text-center">
                      Nenhum item cadastrado
                    </li>
                  ) : (
                    getActiveItems().map(item => (
                      <li key={item.id} className="p-3 flex items-center justify-between">
                        {editingItem === item.id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                            <button
                              onClick={handleSaveEdit}
                              disabled={!itemName.trim() || isProcessing}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              <Save />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isProcessing}
                              className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                            >
                              <Cancel />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-gray-800">{item.name}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={isProcessing}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50 p-1"
                              >
                                <Edit fontSize="small" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={isProcessing}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
                              >
                                <Delete fontSize="small" />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mt-8">
              <p>Estes parâmetros são utilizados no preenchimento dos perfis dos integrantes.</p>
              <p>Alterar estes valores não afeta os perfis existentes.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 