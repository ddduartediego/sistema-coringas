'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import AppLayout from '@/components/layout/AppLayout';
import { Settings, Add, Delete, Edit, Save, Cancel, WhatsApp } from '@mui/icons-material';
import WhatsAppSettings from '@/components/settings/WhatsAppSettings';

interface ConfigItem {
  id: string;
  name: string;
}

type ConfigType = 'whatsapp' | 'roles' | 'status';

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
    return activeTab === 'status' ? statusItems : activeTab === 'roles' ? roleItems : [];
  };

  // Definir lista ativa com base na aba
  const setActiveItems = (items: ConfigItem[]) => {
    if (activeTab === 'status') {
      setStatusItems(items);
    } else if (activeTab === 'roles') {
      setRoleItems(items);
    }
  };

  // Obter tabela ativa com base na aba
  const getActiveTable = () => {
    return activeTab === 'status' ? 'config_status' : activeTab === 'roles' ? 'config_roles' : '';
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Configurações</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex space-x-4 mb-6">
          <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'whatsapp'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'status'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'roles'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Funções
            </button>
          </div>
          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'whatsapp' ? (
            <WhatsAppSettings />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Novo item"
                  className="flex-1 px-4 py-2 border rounded-md mr-4"
                />
                <button
                  onClick={handleAddItem}
                  disabled={isProcessing || !newItemName.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Add className="mr-2" />
                  Adicionar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getActiveItems().map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingItem === item.id ? (
                            <input
                              type="text"
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              className="w-full px-3 py-1 border rounded-md"
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingItem === item.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                <Save />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Cancel />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <Edit />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Delete />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 