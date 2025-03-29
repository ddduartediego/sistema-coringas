'use client';

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";

// Interfaces e tipos
interface PerfilClientProps {
  user: User;
}

interface Perfil {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  name: string;
  phone: string | null;
  bio: string | null;
}

export default function PerfilClient({ user }: PerfilClientProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    bio: "",
  });
  const [editing, setEditing] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Carregar dados do perfil
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true);
        
        // Verificar se já existe um perfil para o usuário
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 é o erro de "not found"
          throw error;
        }
        
        if (data) {
          setPerfil(data);
          setFormData({
            nome: data.name || "",
            telefone: data.phone || "",
            bio: data.bio || "",
          });
        }
      } catch (error: any) {
        console.error('Erro ao carregar perfil:', error.message);
        toast({
          title: "Erro ao carregar perfil",
          description: "Ocorreu um erro ao tentar carregar os dados do seu perfil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerfil();
  }, [user.id, toast]);
  
  // Formatar data
  const formatarData = (dataString: string | null) => {
    if (!dataString) return "";
    return formatDate(dataString, "dd 'de' MMMM 'de' yyyy");
  };
  
  // Salvar perfil
  const handleSalvarPerfil = async () => {
    try {
      setLoading(true);
      
      // Validar campos obrigatórios
      if (!formData.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, informe seu nome.",
          variant: "destructive",
        });
        return;
      }
      
      const perfilData = {
        name: formData.nome,
        phone: formData.telefone,
        bio: formData.bio,
        user_id: user.id,
      };
      
      let result;
      
      if (perfil) {
        // Atualizar perfil existente
        const { data, error } = await supabase
          .from('profiles')
          .update(perfilData)
          .eq('id', perfil.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Criar novo perfil
        const { data, error } = await supabase
          .from('profiles')
          .insert(perfilData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      setPerfil(result);
      toast({
        title: "Perfil salvo",
        description: "Seus dados foram salvos com sucesso.",
      });
      
      setEditing(false);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error.message);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao tentar salvar os dados do seu perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Iniciar edição
  const handleEditarPerfil = () => {
    setEditing(true);
  };
  
  // Cancelar edição
  const handleCancelarEdicao = () => {
    if (perfil) {
      setFormData({
        nome: perfil.name || "",
        telefone: perfil.phone || "",
        bio: perfil.bio || "",
      });
    } else {
      setFormData({
        nome: "",
        telefone: "",
        bio: "",
      });
    }
    setEditing(false);
  };
  
  // Renderizar o formulário de edição
  const renderFormularioEdicao = () => {
    return (
      <div className="mt-6 space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome*
          </label>
          <input
            type="text"
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Seu nome completo"
          />
        </div>
        
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            type="tel"
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="(00) 00000-0000"
          />
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Sobre você
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Conte um pouco sobre você..."
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleCancelarEdicao}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvarPerfil}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    );
  };
  
  // Renderizar os dados do perfil
  const renderDadosPerfil = () => {
    return (
      <div className="mt-6 space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Nome</h3>
            <p className="mt-1 text-sm text-gray-900">{perfil?.name || "Não informado"}</p>
          </div>
          
          {perfil?.phone && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
              <p className="mt-1 text-sm text-gray-900">{perfil.phone}</p>
            </div>
          )}
          
          {perfil?.bio && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Sobre você</h3>
              <p className="mt-1 text-sm text-gray-900">{perfil.bio}</p>
            </div>
          )}
          
          {perfil?.created_at && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Perfil criado em</h3>
              <p className="mt-1 text-sm text-gray-900">{formatarData(perfil.created_at)}</p>
            </div>
          )}
        </div>
        
        <div className="pt-4 flex justify-end">
          <Button onClick={handleEditarPerfil}>
            Editar Perfil
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Seu Perfil</h1>
      <p className="mt-1 text-gray-600">Gerencie seus dados pessoais</p>
      
      {loading && !editing ? (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-sm">
          <p className="text-center text-gray-500">Carregando seus dados...</p>
        </div>
      ) : editing ? (
        renderFormularioEdicao()
      ) : (
        renderDadosPerfil()
      )}
    </div>
  );
} 