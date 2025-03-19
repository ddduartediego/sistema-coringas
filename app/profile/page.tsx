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
  Warning,
  CalendarMonth,
  Bloodtype,
  AssignmentInd,
  LocationCity,
  Group,
  People,
  Home,
  LocationOn,
  Apartment,
  Map,
  Place,
  Numbers
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

// Máscara RG
const formatRG = (value: string) => {
  if (!value) return '';
  
  // Remove todos os caracteres não alfanuméricos
  const cleanValue = value.replace(/[^\w]/g, '');
  
  // Para RGs mais curtos (7-8 dígitos)
  if (cleanValue.length <= 8) {
    if (cleanValue.length === 8) {
      // Formato "0.000.000-0"
      return cleanValue
        .replace(/^(\d)(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4');
    } else if (cleanValue.length === 7) {
      // Formato "000.000-0"
      return cleanValue
        .replace(/^(\d{3})(\d{3})(\d{1})$/, '$1.$2-$3');
    }
    return cleanValue;
  }
  // Para RGs com 9 dígitos (padrão mais comum): 00.000.000-0
  else if (cleanValue.length === 9) {
    return cleanValue
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4');
  } 
  // Para RGs com UF no final: 00.000.000-0/UF
  else if (cleanValue.length > 9 && cleanValue.length <= 11) {
    const rgPart = cleanValue.slice(0, 9);
    const ufPart = cleanValue.slice(9);
    
    return rgPart
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4') + 
      (ufPart ? '/' + ufPart : '');
  }
  // Formato para 8 dígitos: 00000000-0
  else {
    return cleanValue
      .replace(/(\w{8})(\w{1})/, '$1-$2');
  }
};

// Máscara CEP
const formatCEP = (value: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

// Schema de validação
const profileSchema = z.object({
  nickname: z.string().min(1, 'Apelido é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  role: z.string().min(1, 'Função é obrigatória'),
  shirt_size: z.string().min(1, 'Tamanho da camiseta é obrigatório'),
  birth_date: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  gender: z.string().refine((val) => !val || ['Masculino', 'Feminino', 'Prefiro não dizer'].includes(val), {
    message: 'Gênero deve ser Masculino, Feminino ou Prefiro não dizer'
  }).nullable(),
  phone: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  is_blood_donor: z.boolean().optional().nullable(),
  last_blood_donation: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  naturalidade: z.string().optional().nullable(),
  nome_mae: z.string().optional().nullable(),
  nome_pai: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  localidade: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
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
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);
  const [showAddress, setShowAddress] = useState(false);
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

  const { control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<ProfileFormData>({
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
      is_blood_donor: null,
      last_blood_donation: null,
      rg: null,
      naturalidade: null,
      nome_mae: null,
      nome_pai: null,
      cep: null,
      estado: null,
      localidade: null,
      bairro: null,
      logradouro: null,
      numero: null,
      complemento: null,
    }
  });

  // Função para buscar dados do CEP
  const handleCEPSearch = async (cep: string) => {
    if (!cep || cep.length < 8) return;
    
    // Remover caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setValue('estado', data.uf);
        setValue('localidade', data.localidade);
        setValue('bairro', data.bairro);
        setValue('logradouro', data.logradouro);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  // Função para verificar campos incompletos
  const checkIncompleteFields = (profile: any) => {
    const requiredFields = [
      { name: 'nickname', label: 'Apelido' },
      { name: 'status', label: 'Status' },
      { name: 'role', label: 'Função' },
      { name: 'shirt_size', label: 'Tamanho da Camiseta' },
      { name: 'birth_date', label: 'Data de Nascimento' },
      { name: 'cpf', label: 'CPF' },
      { name: 'gender', label: 'Gênero' },
      { name: 'phone', label: 'Telefone' },
      { name: 'profession', label: 'Profissão' },
      { name: 'is_blood_donor', label: 'Doador de Sangue' },
      { name: 'last_blood_donation', label: 'Última Doação' },
      { name: 'rg', label: 'RG' },
      { name: 'naturalidade', label: 'Naturalidade' },
      { name: 'nome_mae', label: 'Nome da Mãe' },
      { name: 'nome_pai', label: 'Nome do Pai' },
      { name: 'cep', label: 'CEP' },
      { name: 'estado', label: 'Estado' },
      { name: 'localidade', label: 'Cidade' },
      { name: 'bairro', label: 'Bairro' },
      { name: 'logradouro', label: 'Logradouro' },
      { name: 'numero', label: 'Número' },
    ];

    const incomplete = requiredFields.filter(field => {
      // Se o campo for is_blood_donor, verificamos se é null (não respondido)
      if (field.name === 'is_blood_donor') {
        return profile[field.name] === null;
      }
      
      // Se for última doação, só validamos se for doador
      if (field.name === 'last_blood_donation') {
        return profile.is_blood_donor === true && !profile[field.name];
      }
      
      // Para os demais campos
      return !profile[field.name];
    });

    setIncompleteFields(incomplete.map(field => field.label));
  };

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
        
        // Verificar campos incompletos
        if (profile) {
          checkIncompleteFields(profile);
        }

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
          setValue('is_blood_donor', profile.is_blood_donor || null);
          setValue('last_blood_donation', profile.last_blood_donation || null);
          setValue('rg', profile.rg || null);
          setValue('naturalidade', profile.naturalidade || null);
          setValue('nome_mae', profile.nome_mae || null);
          setValue('nome_pai', profile.nome_pai || null);
          setValue('cep', profile.cep || null);
          setValue('estado', profile.estado || null);
          setValue('localidade', profile.localidade || null);
          setValue('bairro', profile.bairro || null);
          setValue('logradouro', profile.logradouro || null);
          setValue('numero', profile.numero || null);
          setValue('complemento', profile.complemento || null);
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
          is_blood_donor: data.is_blood_donor,
          last_blood_donation: data.last_blood_donation,
          rg: data.rg,
          naturalidade: data.naturalidade,
          nome_mae: data.nome_mae,
          nome_pai: data.nome_pai,
          cep: data.cep,
          estado: data.estado,
          localidade: data.localidade,
          bairro: data.bairro,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileData.id);

      if (error) throw error;

      // Atualizar dados locais
      const updatedProfile = {
        ...profileData,
        ...data
      };
      setProfileData(updatedProfile);
      
      // Verificar campos incompletos após atualização
      checkIncompleteFields(updatedProfile);

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
        is_blood_donor: profileData.is_blood_donor || null,
        last_blood_donation: profileData.last_blood_donation || null,
        rg: profileData.rg || null,
        naturalidade: profileData.naturalidade || null,
        nome_mae: profileData.nome_mae || null,
        nome_pai: profileData.nome_pai || null,
        cep: profileData.cep || null,
        estado: profileData.estado || null,
        localidade: profileData.localidade || null,
        bairro: profileData.bairro || null,
        logradouro: profileData.logradouro || null,
        numero: profileData.numero || null,
        complemento: profileData.complemento || null,
      });
    }
    setIsEditing(false);
  };

  // Função para verificar se pode doar sangue
  const canDonateBlood = (lastDonationDate: string | null) => {
    if (!lastDonationDate) return true;
    
    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return lastDonation <= threeMonthsAgo;
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
      <div className="pb-8">
        {/* Header com foto de perfil */}
        <motion.div 
          className="bg-white rounded-lg shadow-md mb-8"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

            {/* Aviso de campos incompletos */}
            {!isEditing && incompleteFields.length > 0 && (
              <motion.div 
                className="mx-6 mt-6 p-4 rounded-md bg-yellow-50 text-yellow-800 flex items-start"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Warning className="mr-2 mt-0.5 text-yellow-600" fontSize="small" />
                <div>
                  <p className="font-medium">Seu perfil está incompleto</p>
                  <p className="text-sm mt-1">Os seguintes campos precisam ser preenchidos:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {incompleteFields.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Completar perfil
                  </button>
                </div>
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
              <div className="space-y-4">
                {/* Nome e Apelido em layout de duas colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="flex items-start">
                    <AccountCircle className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Nome</p>
                      <p className="font-medium">{userData.name}</p>
                    </div>
                  </div>

                  {/* Apelido */}
                  <div className="flex items-start">
                    <Badge className="text-gray-400 mt-1 mr-3" />
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
                                className={`w-full p-2 border ${errors.nickname ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                              />
                            )}
                          />
                          {errors.nickname && (
                            <p className="mt-1 text-sm text-red-500">{errors.nickname.message}</p>
                          )}
                        </div>
                      ) : (
                        <p className="font-medium">{profileData?.nickname || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email e Telefone em layout de duas colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start">
                    <AccountCircle className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{userData.email}</p>
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
                </div>

                {/* Gênero */}
                <div className="flex items-start">
                  <Person className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Gênero</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              value={field.value || ''}
                              className={`w-full p-2 border ${errors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none`}
                            >
                              <option value="">Selecione o gênero</option>
                              <option value="Masculino">Masculino</option>
                              <option value="Feminino">Feminino</option>
                              <option value="Prefiro não dizer">Prefiro não dizer</option>
                            </select>
                          )}
                        />
                        {errors.gender && (
                          <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium">{profileData?.gender || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Doador de Sangue e Última Doação em duas colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Doador de Sangue */}
                  <div className="flex items-start">
                    <Bloodtype className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Doador de Sangue</p>
                      {isEditing ? (
                        <div>
                          <Controller
                            name="is_blood_donor"
                            control={control}
                            render={({ field: { value, onChange, ...field } }) => (
                              <input
                                {...field}
                                type="checkbox"
                                checked={value || false}
                                onChange={(e) => onChange(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <p className="font-medium">{profileData?.is_blood_donor ? 'Sim' : 'Não'}</p>
                      )}
                    </div>
                  </div>

                  {/* Última Doação - Só exibe se for doador */}
                  {(isEditing ? watch('is_blood_donor') : profileData?.is_blood_donor) && (
                    <div className="flex items-start">
                      <CalendarMonth className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Última Doação</p>
                        {isEditing ? (
                          <div>
                            <Controller
                              name="last_blood_donation"
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
                            {profileData?.last_blood_donation ? new Date(profileData.last_blood_donation).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        )}
                        {profileData?.is_blood_donor && canDonateBlood(profileData?.last_blood_donation) && (
                          <p className="text-sm text-green-600 mt-1">
                            🩸Você já pode fazer uma nova doação!
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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

                {/* CPF e RG em duas colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* RG */}
                  <div className="flex items-start">
                    <AssignmentInd className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">RG</p>
                      {isEditing ? (
                        <div>
                          <Controller
                            name="rg"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="text"
                                maxLength={14}
                                value={field.value ? formatRG(field.value) : ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              />
                            )}
                          />
                        </div>
                      ) : (
                        <p className="font-medium">{profileData?.rg ? formatRG(profileData.rg) : '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nome da Mãe e Nome do Pai em duas colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome da Mãe */}
                  <div className="flex items-start">
                    <People className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Nome da Mãe</p>
                      {isEditing ? (
                        <div>
                          <Controller
                            name="nome_mae"
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
                        <p className="font-medium">{profileData?.nome_mae || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Nome do Pai */}
                  <div className="flex items-start">
                    <People className="text-gray-400 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Nome do Pai</p>
                      {isEditing ? (
                        <div>
                          <Controller
                            name="nome_pai"
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
                        <p className="font-medium">{profileData?.nome_pai || '-'}</p>
                      )}
                    </div>
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

                {/* Naturalidade */}
                <div className="flex items-start">
                  <LocationCity className="text-gray-400 mt-1 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Naturalidade</p>
                    {isEditing ? (
                      <div>
                        <Controller
                          name="naturalidade"
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
                      <p className="font-medium">{profileData?.naturalidade || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Título da seção de endereço com botão de collapse */}
                <div className="border-t pt-4 mt-4">
                  <button 
                    onClick={() => setShowAddress(!showAddress)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-md font-semibold text-gray-700">Endereço</h3>
                    <div className="text-blue-600">
                      {showAddress ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>

                {/* Campos de endereço - exibidos apenas quando expandidos */}
                {showAddress && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 mt-4"
                  >
                    {/* CEP */}
                    <div className="flex items-start">
                      <LocationOn className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">CEP</p>
                        {isEditing ? (
                          <div>
                            <Controller
                              name="cep"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  maxLength={9}
                                  value={field.value ? formatCEP(field.value) : ''}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length === 8) {
                                      handleCEPSearch(val);
                                    }
                                  }}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                />
                              )}
                            />
                          </div>
                        ) : (
                          <p className="font-medium">{profileData?.cep ? formatCEP(profileData.cep) : '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex items-start">
                      <Map className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Estado</p>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={watch('estado') || ''}
                              readOnly
                              className="w-full p-2 border border-gray-200 bg-gray-50 rounded-md text-gray-600"
                            />
                            <p className="mt-1 text-xs text-gray-500">Preenchido automaticamente pelo CEP</p>
                          </div>
                        ) : (
                          <p className="font-medium">{profileData?.estado || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Localidade (Cidade) */}
                    <div className="flex items-start">
                      <LocationCity className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Cidade</p>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={watch('localidade') || ''}
                              readOnly
                              className="w-full p-2 border border-gray-200 bg-gray-50 rounded-md text-gray-600"
                            />
                            <p className="mt-1 text-xs text-gray-500">Preenchido automaticamente pelo CEP</p>
                          </div>
                        ) : (
                          <p className="font-medium">{profileData?.localidade || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Bairro */}
                    <div className="flex items-start">
                      <Place className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Bairro</p>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={watch('bairro') || ''}
                              readOnly
                              className="w-full p-2 border border-gray-200 bg-gray-50 rounded-md text-gray-600"
                            />
                            <p className="mt-1 text-xs text-gray-500">Preenchido automaticamente pelo CEP</p>
                          </div>
                        ) : (
                          <p className="font-medium">{profileData?.bairro || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Logradouro */}
                    <div className="flex items-start">
                      <Home className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Logradouro</p>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={watch('logradouro') || ''}
                              readOnly
                              className="w-full p-2 border border-gray-200 bg-gray-50 rounded-md text-gray-600"
                            />
                            <p className="mt-1 text-xs text-gray-500">Preenchido automaticamente pelo CEP</p>
                          </div>
                        ) : (
                          <p className="font-medium">{profileData?.logradouro || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Número */}
                    <div className="flex items-start">
                      <Numbers className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Número</p>
                        {isEditing ? (
                          <div>
                            <Controller
                              name="numero"
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
                          <p className="font-medium">{profileData?.numero || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Complemento */}
                    <div className="flex items-start">
                      <Apartment className="text-gray-400 mt-1 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Complemento</p>
                        {isEditing ? (
                          <div>
                            <Controller
                              name="complemento"
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
                          <p className="font-medium">{profileData?.complemento || '-'}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
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