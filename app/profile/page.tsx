'use client';

import { useState, useEffect, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/models/database.types';
import AppLayout from '@/components/layout/AppLayout';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import {
  Person,
  Edit,
  Save,
  Close,
  Cake,
  Phone,
  Badge,
  AccountCircle,
  BusinessCenter,
  Check,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import CobrancasIntegrante from './components/CobrancasIntegrante';

// Importar o framer-motion dinamicamente para evitar erros de SSR
const MotionDiv = dynamic(() => 
  import('framer-motion').then((mod) => mod.motion.div), 
  { ssr: false }
);

interface MotionProps {
  children: ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
}

const MotionComponent = ({ children, ...props }: MotionProps) => (
  <MotionDiv {...props}>{children}</MotionDiv>
);

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
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<{id: string, name: string}[]>([]);
  const [roleOptions, setRoleOptions] = useState<{id: string, name: string}[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    avatar_url: string;
  }>({
    id: '',
    name: '',
    email: '',
    avatar_url: '',
  });
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProfileFormData>({
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

        // Buscar dados do usuário autenticado
        setUserData({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Usuário',
          email: session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
        });

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

      // Atualizar dados locais
      setProfileData({
        ...profileData,
        ...data
      });

      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      });
      
      setIsEditing(false);
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

  const handleCancel = () => {
    // Resetar para os valores originais
    if (profileData) {
      reset({
        nickname: profileData.nickname || '',
        status: profileData.status || '',
        role: profileData.role || '',
        shirt_size: profileData.shirt_size || '',
        birth_date: profileData.birth_date || null,
        cpf: profileData.cpf || null,
        gender: profileData.gender || null,
        phone: profileData.phone || null,
        profession: profileData.profession || null,
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="animate-pulse flex flex-col items-center">
                <div className="bg-blue-500 p-10 w-full flex justify-center items-center">
                  <div className="bg-gray-200 rounded-full h-24 w-24"></div>
                </div>
                <div className="p-6 w-full">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
                  <div className="h-20 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="space-y-4 w-full">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-center">
                        <div className="bg-gray-200 h-8 w-8 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header com foto de perfil */}
        <motion.div 
          className="bg-white rounded-lg shadow-md overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-blue-600 p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden mb-3">
              {userData.avatar_url ? (
                <img 
                  src={userData.avatar_url} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-400 flex items-center justify-center">
                  <Person className="text-white text-4xl" />
                </div>
              )}
            </div>
            <h1 className="text-white text-xl font-semibold">{userData.name}</h1>
            <p className="text-blue-100 text-sm">{userData.email}</p>
          </div>
        </motion.div>

        {/* Grid com Informações Pessoais e Cobranças */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações Pessoais */}
          <motion.div 
            className="bg-white rounded-lg shadow-md overflow-hidden h-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Mensagem de sucesso/erro */}
            {message && (
              <motion.div 
                className={`mx-6 mt-6 p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {message.type === 'success' ? (
                  <Check className="mr-2 text-green-500" fontSize="small" />
                ) : (
                  <Warning className="mr-2 text-red-500" fontSize="small" />
                )}
                {message.text}
              </motion.div>
            )}

            {/* Informações do perfil */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Informações Pessoais</h2>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleSubmit(onSubmit)}
                      disabled={saving}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {saving ? (
                        <div className="mr-1 h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="mr-1" fontSize="small" />
                      )}
                      <span className="text-sm">Salvar</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      <Close className="mr-1" fontSize="small" />
                      <span className="text-sm">Cancelar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="mr-1" fontSize="small" />
                    <span className="text-sm">Editar</span>
                  </button>
                )}
              </div>

              {/* Tags de status */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profileData?.status === 'Veterano' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {profileData?.status || 'Membro'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {profileData?.role || 'Liderança'}
                </span>
              </div>

              {/* Lista de informações com ícones */}
              <div className="space-y-6">
                {/* Apelido */}
                <div className="flex items-start">
                  <AccountCircle className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Apelido</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="nickname"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        />
                        {errors.nickname && (
                          <p className="mt-1 text-xs text-red-600">{errors.nickname.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium">{profileData?.nickname || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Tamanho Camiseta */}
                <div className="flex items-start">
                  <div className="text-gray-400 mt-1 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Tamanho da Camiseta</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="shirt_size"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                          <p className="mt-1 text-xs text-red-600">{errors.shirt_size.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium">{profileData?.shirt_size || '-'}</p>
                    )}
                  </div>
                </div>

                {/* CPF */}
                <div className="flex items-start">
                  <Badge className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">CPF</p>
                    {isEditing ? (
                      <div>
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
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                    ) : (
                      <p className="font-medium">{profileData?.cpf ? formatCPF(profileData.cpf) : '-'}</p>
                    )}
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div className="flex items-start">
                  <Cake className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Data de Nascimento</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="birth_date"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="date"
                              value={field.value || ''}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                    ) : (
                      <p className="font-medium">
                        {profileData?.birth_date ? new Date(profileData.birth_date).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Telefone */}
                <div className="flex items-start">
                  <Phone className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Telefone</p>
                    {isEditing ? (
                      <div>
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
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                    ) : (
                      <p className="font-medium">{profileData?.phone ? formatPhone(profileData.phone) : '-'}</p>
                    )}
                  </div>
                </div>

                {/* Profissão */}
                <div className="flex items-start">
                  <BusinessCenter className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Profissão</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="profession"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              value={field.value || ''}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                          )}
                        />
                      </div>
                    ) : (
                      <p className="font-medium">{profileData?.profession || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Campos status e role ocultos mas necessários para validação */}
                {isEditing && (
                  <div className="hidden">
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="hidden" />
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Cobranças */}
          <motion.div
            className="bg-white rounded-lg shadow-md overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="p-6">
              <CobrancasIntegrante 
                supabase={supabase} 
                userId={userData.id} 
              />
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
} 