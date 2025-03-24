'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Schema de validação
const equipeFormSchema = z.object({
  nome: z.string()
    .min(3, { message: 'O nome da equipe deve ter pelo menos 3 caracteres' })
    .max(50, { message: 'O nome da equipe deve ter no máximo 50 caracteres' })
});

type EquipeFormData = z.infer<typeof equipeFormSchema>;

interface ModalCriarEquipeProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  onSuccess: (equipe: { id: string; nome: string; status: string }) => void;
}

export default function ModalCriarEquipe({ 
  isOpen, 
  onClose,
  gameId,
  onSuccess
}: ModalCriarEquipeProps) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm<EquipeFormData>({
    resolver: zodResolver(equipeFormSchema),
    defaultValues: {
      nome: ''
    }
  });

  const onSubmit = async (data: EquipeFormData) => {
    if (!gameId) {
      console.error('ID do game não fornecido');
      toast({
        title: "Erro",
        description: "ID do game não fornecido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Iniciando processo de criação de equipe para o game:', gameId);
      console.log('Nome da equipe:', data.nome);

      // Obter o ID do usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter dados do usuário:', userError);
        toast({
          title: "Erro de autenticação",
          description: userError.message || "Não foi possível obter os dados do usuário.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      const authUserId = userData?.user?.id;

      if (!authUserId) {
        console.error('Usuário não autenticado - userData:', userData);
        toast({
          title: "Não autenticado",
          description: "Você precisa estar logado para criar uma equipe.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      console.log('Usuário autenticado com ID:', authUserId);
      
      // Buscar o profile do usuário (que é diferente do auth.user)
      console.log('Buscando profile do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authUserId)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar profile do usuário:', profileError);
        toast({
          title: "Perfil não encontrado",
          description: "Seu perfil de usuário não foi encontrado no sistema.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      if (!profileData || !profileData.id) {
        console.error('Profile do usuário não encontrado');
        toast({
          title: "Perfil não disponível",
          description: "Seu perfil de usuário não está disponível. Entre em contato com o administrador.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      const userId = profileData.id;
      console.log('Profile do usuário encontrado com ID:', userId);
      
      // Verificação direta se o usuário já está em alguma equipe do game
      try {
        console.log('Verificando se o usuário já está em uma equipe neste game...');
        // Buscar todas as equipes do game
        const { data: equipes, error: equipesError } = await supabase
          .from('game_equipes')
          .select('id')
          .eq('game_id', gameId);
        
        if (equipesError) {
          console.error('Erro ao buscar equipes do game:', equipesError);
          throw new Error(`Erro ao verificar participação: ${equipesError.message}`);
        }
        
        if (equipes && equipes.length > 0) {
          console.log(`Encontradas ${equipes.length} equipes, verificando participação...`);
          const equipesIds = equipes.map(e => e.id);
          
          // Verificar se o usuário é integrante de alguma dessas equipes
          const { data: membros, error: membrosError } = await supabase
            .from('equipe_integrantes')
            .select('equipe_id')
            .eq('integrante_id', userId)
            .in('equipe_id', equipesIds);
          
          if (membrosError) {
            console.error('Erro ao verificar integrantes:', membrosError);
            throw new Error(`Erro ao verificar participação: ${membrosError.message}`);
          }
          
          if (membros && membros.length > 0) {
            console.log('Usuário já participa de uma equipe neste game:', membros[0]);
            toast({
              title: "Já inscrito",
              description: "Você já está inscrito em uma equipe para este game.",
              variant: "destructive",
            });
            setSaving(false);
            return;
          }
        }
        
        console.log('Usuário não pertence a nenhuma equipe neste game. Prosseguindo com criação...');
      } catch (verifyError: any) {
        console.error('Erro ao verificar participação:', verifyError);
        toast({
          title: "Erro na verificação",
          description: verifyError.message || "Não foi possível verificar se você já está em uma equipe.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // Dados da equipe a ser criada
      const dadosEquipe = {
        game_id: gameId,
        nome: data.nome,
        status: "pendente",
        lider_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Inserindo nova equipe com dados:', dadosEquipe);
      
      // Criar a equipe
      let novaEquipeId = '';
      let nomeEquipe = '';
      let statusEquipe = '';
      
      try {
        // Criar equipe com insert básico
        console.log('Realizando inserção no banco de dados...');
        const { data: resultadoInsert, error: insertError } = await supabase
          .from('game_equipes')
          .insert(dadosEquipe)
          .select('id, nome, status')
          .single();
        
        if (insertError) {
          console.error('Erro ao inserir equipe:', insertError);
          
          // Log detalhado para depuração
          if (insertError.code) {
            console.error(`Código do erro: ${insertError.code}`);
          }
          if (insertError.details) {
            console.error(`Detalhes do erro: ${insertError.details}`);
          }
          if (insertError.hint) {
            console.error(`Dica do erro: ${insertError.hint}`);
          }
          
          throw new Error(`Falha ao criar equipe: ${insertError.message || 'Erro desconhecido'}`);
        }
        
        console.log('Resultado da inserção:', resultadoInsert);
        
        if (!resultadoInsert) {
          console.error('Nenhum dado retornado após inserção da equipe');
          throw new Error('Falha ao criar equipe: nenhum dado retornado');
        }
        
        console.log('Equipe criada com sucesso:', resultadoInsert);
        novaEquipeId = resultadoInsert.id;
        nomeEquipe = resultadoInsert.nome;
        statusEquipe = resultadoInsert.status;
        
        // Adicionar o usuário como integrante da equipe
        const dadosIntegrante = {
          equipe_id: novaEquipeId,
          integrante_id: userId,
          status: "ativo",
          is_owner: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Adicionando usuário como integrante com dados:', dadosIntegrante);
        
        const { error: integranteError } = await supabase
          .from('equipe_integrantes')
          .insert(dadosIntegrante);
        
        if (integranteError) {
          console.error('Erro ao adicionar integrante:', integranteError);
          throw new Error(`Falha ao adicionar integrante: ${integranteError.message || 'Erro desconhecido'}`);
        }
        
        console.log('Integrante adicionado com sucesso');
        
        // Registro completo com sucesso
        toast({
          title: "Equipe criada com sucesso!",
          description: "Sua equipe foi registrada e está aguardando aprovação.",
        });
        
        // Resetar o formulário e fechar o modal
        reset();
        onSuccess({
          id: novaEquipeId,
          nome: nomeEquipe,
          status: statusEquipe
        });
        onClose();
      } catch (createError: any) {
        console.error('Erro durante a criação da equipe:', createError);
        toast({
          title: "Erro ao criar equipe",
          description: createError.message || "Ocorreu um erro ao tentar criar sua equipe.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Este é o handler de erro geral
      console.error('Erro geral no processo de criação de equipe:', error);
      let mensagemErro = "Ocorreu um erro ao tentar criar sua equipe.";
      
      if (error instanceof Error) {
        mensagemErro = error.message;
      } else if (typeof error === 'object' && error !== null) {
        mensagemErro = JSON.stringify(error);
      } else if (typeof error === 'string') {
        mensagemErro = error;
      }
      
      toast({
        title: "Erro ao criar equipe",
        description: mensagemErro,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        >
          {/* Cabeçalho */}
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-gray-800">
              Criar Nova Equipe
              {process.env.NODE_ENV === 'development' && (
                <small className="mt-1 block text-xs text-gray-400">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)}...
                </small>
              )}
            </Dialog.Title>
            
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              disabled={saving}
            >
              <Close className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome da Equipe*
                </label>
                <input
                  type="text"
                  {...register('nome')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Digite o nome da sua equipe"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  Ao criar uma equipe:
                </p>
                <ul className="ml-5 list-disc text-sm text-gray-600">
                  <li>Você será definido como líder da equipe</li>
                  <li>A equipe ficará com status "pendente" até aprovação</li>
                  <li>Outros integrantes poderão solicitar participação na equipe</li>
                  <li>Você aprova ou rejeita as solicitações acessando Gerenciar Equipe</li>
                </ul>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Criando...' : 'Criar Equipe'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </Dialog>
  );
} 