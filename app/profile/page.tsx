'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import AppLayout from '@/components/layout/AppLayout';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Person } from '@mui/icons-material';

// Máscara CPF
const formatCPF = (value: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Máscara telefone
const formatPhone = (value: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

// Schema de validação
const profileSchema = z.object({
  nickname: z.string().min(1, 'Apelido é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  role: z.string().min(1, 'Função é obrigatória'),
  shirt_size: z.string().min(1, 'Tamanho da camiseta é obrigatório'),
  birth_date: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<{id: string, name: string}[]>([]);
  const [roleOptions, setRoleOptions] = useState<{id: string, name: string}[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: '',
      status: '',
      role: '',
      shirt_size: '',
      birth_date: null,
      cpf: null,
      gender: null,
      phone: null,
      profession: null,
    }
  });

  // Buscar dados do perfil e opções
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        // Buscar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        setProfileData(profile);

        // Preencher formulário
        if (profile) {
          setValue('nickname', profile.nickname || '');
          setValue('status', profile.status || '');
          setValue('role', profile.role || '');
          setValue('shirt_size', profile.shirt_size || '');
          setValue('birth_date', profile.birth_date || null);
          setValue('cpf', profile.cpf || null);
          setValue('gender', profile.gender || null);
          setValue('phone', profile.phone || null);
          setValue('profession', profile.profession || null);
        }

        // Buscar opções de status
        const { data: status } = await supabase
          .from('config_status')
          .select('id, name');
        
        setStatusOptions(status || []);

        // Buscar opções de funções
        const { data: roles } = await supabase
          .from('config_roles')
          .select('id, name');
        
        setRoleOptions(roles || []);

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      setMessage(null);

      if (!profileData?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: data.nickname,
          status: data.status,
          role: data.role,
          shirt_size: data.shirt_size,
          birth_date: data.birth_date,
          cpf: data.cpf,
          gender: data.gender,
          phone: data.phone,
          profession: data.profession,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileData.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setMessage({
        type: 'error',
        text: `Erro ao atualizar perfil: ${error.message}`
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Person className="text-primary-600 text-3xl mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
          </div>
          <button
            type="submit"
            form="profile-form"
            disabled={saving}
            className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {saving ? (
              <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="mr-2" />
            )}
            Salvar
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Apelido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apelido*
                </label>
                <Controller
                  name="nickname"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    />
                  )}
                />
                {errors.nickname && (
                  <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status*
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    profileData?.is_admin ? (
                      <select
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        {statusOptions.map(option => (
                          <option key={option.id} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        {...field}
                        type="text"
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                      />
                    )
                  )}
                />
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              {/* Função */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função na equipe*
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    profileData?.is_admin ? (
                      <select
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        {roleOptions.map(option => (
                          <option key={option.id} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        {...field}
                        type="text"
                        readOnly
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                      />
                    )
                  )}
                />
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Tamanho da camiseta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamanho da camiseta*
                </label>
                <Controller
                  name="shirt_size"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="PP">PP</option>
                      <option value="P">P</option>
                      <option value="M">M</option>
                      <option value="G">G</option>
                      <option value="GG">GG</option>
                      <option value="XG">XG</option>
                      <option value="XXG">XXG</option>
                    </select>
                  )}
                />
                {errors.shirt_size && (
                  <p className="mt-1 text-sm text-red-600">{errors.shirt_size.message}</p>
                )}
              </div>

              {/* Data de nascimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de nascimento
                </label>
                <Controller
                  name="birth_date"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      value={field.value || ''}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    />
                  )}
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      maxLength={14}
                      value={field.value ? formatCPF(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    />
                  )}
                />
              </div>

              {/* Gênero */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero
                </label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value || ''}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Prefiro não responder">Prefiro não responder</option>
                    </select>
                  )}
                />
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Celular
                </label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      maxLength={15}
                      value={field.value ? formatPhone(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    />
                  )}
                />
              </div>

              {/* Profissão */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profissão
                </label>
                <Controller
                  name="profession"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      value={field.value || ''}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    />
                  )}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
} 