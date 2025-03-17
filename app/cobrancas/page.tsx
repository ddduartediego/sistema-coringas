'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  Add, 
  AttachMoney, 
  CheckCircle, 
  Warning, 
  Search,
  FilterList,
  Payment
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import ModalCobranca from './components/ModalCobranca';
import ModalCobrancaIntegrante from './components/ModalCobrancaIntegrante';
import ListaCobrancas from './components/ListaCobrancas';
import AlertaPersonalizado from './components/AlertaPersonalizado';

// Componente de card para métricas
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  bgColor 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  bgColor: string;
}) => (
  <div className={`${bgColor} rounded-lg shadow-md p-4 flex items-center`}>
    <div className="mr-4 text-gray-700">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default function CobrancasPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState({
    valorTotal: 0,
    valorRecebido: 0,
    valorAReceber: 0,
    valorEmAtraso: 0
  });
  const [cobrancas, setCobrancas] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroIntegrante, setFiltroIntegrante] = useState<string>('');
  const [filtroNome, setFiltroNome] = useState<string>('');
  const [integrantes, setIntegrantes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalIntegrante, setShowModalIntegrante] = useState(false);
  const [cobrancaIdParaEditar, setCobrancaIdParaEditar] = useState<string | undefined>(undefined);
  const [cobrancaIntegranteIdParaEditar, setCobrancaIntegranteIdParaEditar] = useState<string | undefined>(undefined);
  const [alerta, setAlerta] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info';
    aberto: boolean;
  }>({
    mensagem: '',
    tipo: 'sucesso',
    aberto: false
  });
  
  // Verificar se o usuário está autenticado e é administrador
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        // Verificar se o usuário é administrador
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (error) {
          console.error('Erro ao buscar perfil:', error);
          router.push('/login');
          return;
        }
        
        if (!profile || !profile.is_admin) {
          router.push('/dashboard');
          return;
        }
        
        setUserData(profile);
        setLoading(false);
      } catch (error) {
        console.error('Erro durante verificação de usuário:', error);
        router.push('/login');
      }
    };
    
    checkUser();
  }, [supabase, router]);
  
  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    if (!userData) return;
    
    setLoading(true);
    
    try {
      // Obter todas as cobranças de integrantes
      const { data: cobrancaIntegrantes } = await supabase
        .from('cobranca_integrantes')
        .select(`
          id,
          status,
          data_pagamento,
          cobranca_id,
          integrante_id,
          cobrancas (
            id,
            nome,
            valor,
            mes_vencimento,
            ano_vencimento
          ),
          profiles (
            id,
            name,
            email
          )
        `);
      
      if (cobrancaIntegrantes) {
        // Calcular métricas
        const dataAtual = new Date();
        const mesAtual = dataAtual.getMonth() + 1; // Janeiro é 0
        const anoAtual = dataAtual.getFullYear();
        
        let valorTotal = 0;
        let valorRecebido = 0;
        let valorAReceber = 0;
        let valorEmAtraso = 0;
        
        cobrancaIntegrantes.forEach((item: any) => {
          const valor = item.cobrancas?.valor || 0;
          valorTotal += valor;
          
          if (item.status === 'Pago') {
            valorRecebido += valor;
          } else {
            valorAReceber += valor;
            
            // Verificar se está em atraso
            const mesVencimento = item.cobrancas?.mes_vencimento;
            const anoVencimento = item.cobrancas?.ano_vencimento;
            
            if (
              (anoVencimento < anoAtual) || 
              (anoVencimento === anoAtual && mesVencimento < mesAtual)
            ) {
              valorEmAtraso += valor;
            }
          }
        });
        
        setDashboardData({
          valorTotal,
          valorRecebido,
          valorAReceber,
          valorEmAtraso
        });
        
        // Processar cobranças para exibição
        const cobranças = cobrancaIntegrantes.map((item: any) => ({
          id: item.id,
          cobrancaId: item.cobranca_id,
          nome: item.cobrancas?.nome || '',
          valor: item.cobrancas?.valor || 0,
          status: item.status,
          integrante: item.profiles?.name || '',
          integranteId: item.integrante_id,
          mesVencimento: item.cobrancas?.mes_vencimento || 1,
          anoVencimento: item.cobrancas?.ano_vencimento || 2023,
          emAtraso: (
            (item.status !== 'Pago') && 
            (
              (item.cobrancas?.ano_vencimento < anoAtual) || 
              (item.cobrancas?.ano_vencimento === anoAtual && item.cobrancas?.mes_vencimento < mesAtual)
            )
          )
        }));
        
        setCobrancas(cobranças);
      }
      
      // Carregar lista de integrantes para o filtro
      const { data: integrantesData } = await supabase
        .from('profiles')
        .select('id, name, email, status, nickname')
        .order('name');
      
      if (integrantesData) {
        setIntegrantes(integrantesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar dados iniciais
  useEffect(() => {
    if (!userData) return;
    loadDashboardData();
  }, [userData]);
  
  // Filtrar cobranças
  const cobrancasFiltradas = cobrancas.filter((cobranca) => {
    // Filtro por status
    if (filtroStatus === 'pago' && cobranca.status !== 'Pago') return false;
    if (filtroStatus === 'pendente' && cobranca.status !== 'Pendente') return false;
    if (filtroStatus === 'atrasado' && !cobranca.emAtraso) return false;
    
    // Filtro por integrante
    if (filtroIntegrante && cobranca.integranteId !== filtroIntegrante) return false;
    
    // Filtro por nome
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
  
  // Criar nova cobrança
  const criarNovaCobranca = () => {
    setCobrancaIdParaEditar(undefined);
    setShowModal(true);
  };
  
  // Editar cobrança
  const editarCobranca = (id: string) => {
    console.log('Editando cobrança com ID:', id);
    setCobrancaIntegranteIdParaEditar(id);
    setShowModalIntegrante(true);
  };
  
  // Excluir cobrança
  const excluirCobranca = async (cobrancaIntegranteId: string, cobrancaId: string) => {
    try {
      setLoading(true);
      
      // 1. Excluir relação na tabela cobranca_integrantes
      const { error: errorIntegrante } = await supabase
        .from('cobranca_integrantes')
        .delete()
        .eq('id', cobrancaIntegranteId);
      
      if (errorIntegrante) {
        throw new Error(`Erro ao excluir relação com integrante: ${errorIntegrante.message}`);
      }
      
      // 2. Verificar se existem outras relações com esta cobrança
      const { data: outrasRelacoes, error: errorCheck } = await supabase
        .from('cobranca_integrantes')
        .select('id')
        .eq('cobranca_id', cobrancaId);
      
      if (errorCheck) {
        throw new Error(`Erro ao verificar relações: ${errorCheck.message}`);
      }
      
      // Se não existirem outras relações, excluir a cobrança e suas parcelas
      if (!outrasRelacoes || outrasRelacoes.length === 0) {
        // 3. Excluir parcelas
        const { error: errorParcelas } = await supabase
          .from('cobranca_parcelas')
          .delete()
          .eq('cobranca_id', cobrancaId);
        
        if (errorParcelas) {
          throw new Error(`Erro ao excluir parcelas: ${errorParcelas.message}`);
        }
        
        // 4. Excluir cobrança principal
        const { error: errorCobranca } = await supabase
          .from('cobrancas')
          .delete()
          .eq('id', cobrancaId);
        
        if (errorCobranca) {
          throw new Error(`Erro ao excluir cobrança: ${errorCobranca.message}`);
        }
      }
      
      loadDashboardData();
      setAlerta({
        mensagem: 'Cobrança excluída com sucesso!',
        tipo: 'sucesso',
        aberto: true
      });
    } catch (error: any) {
      console.error('Erro ao excluir cobrança:', error);
      setAlerta({
        mensagem: `Ocorreu um erro ao excluir a cobrança: ${error.message}`,
        tipo: 'erro',
        aberto: true
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Cobranças</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Add className="mr-1" /> Nova Cobrança
            </button>
          </div>
        </div>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total em Cobranças"
            value={formatarValor(dashboardData.valorTotal)}
            icon={<Payment fontSize="large" />}
            bgColor="bg-blue-100"
          />
          <MetricCard
            title="Total Recebido"
            value={formatarValor(dashboardData.valorRecebido)}
            icon={<CheckCircle fontSize="large" />}
            bgColor="bg-green-100"
          />
          <MetricCard
            title="A Receber"
            value={formatarValor(dashboardData.valorAReceber)}
            icon={<AttachMoney fontSize="large" />}
            bgColor="bg-amber-100"
          />
          <MetricCard
            title="Em Atraso"
            value={formatarValor(dashboardData.valorEmAtraso)}
            icon={<Warning fontSize="large" />}
            bgColor="bg-red-100"
          />
        </div>
        
        {/* Lista de Cobranças */}
        <ListaCobrancas
          cobrancas={cobrancas}
          integrantes={integrantes}
          supabase={supabase}
          onUpdate={loadDashboardData}
          onEditarCobranca={(id) => {
            setCobrancaIntegranteIdParaEditar(id);
            setShowModalIntegrante(true);
          }}
          onExcluirCobranca={excluirCobranca}
        />
        
        {/* Modal de Nova Cobrança */}
        <ModalCobranca
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setCobrancaIdParaEditar(undefined);
          }}
          onSave={() => {
            setShowModal(false);
            setCobrancaIdParaEditar(undefined);
            loadDashboardData();
          }}
          supabase={supabase}
          cobrancaId={cobrancaIdParaEditar}
        />
        
        {/* Modal de Atribuição de Cobrança */}
        <ModalCobrancaIntegrante
          isOpen={showModalIntegrante}
          onClose={() => {
            setShowModalIntegrante(false);
            setCobrancaIntegranteIdParaEditar(undefined);
          }}
          onSave={() => {
            setShowModalIntegrante(false);
            setCobrancaIntegranteIdParaEditar(undefined);
            loadDashboardData();
          }}
          supabase={supabase}
          cobrancaIntegranteId={cobrancaIntegranteIdParaEditar}
        />
        
        {/* Alertas */}
        <AlertaPersonalizado
          mensagem={alerta.mensagem}
          tipo={alerta.tipo}
          open={alerta.aberto}
          onClose={() => setAlerta(prev => ({ ...prev, aberto: false }))}
        />
      </div>
    </AppLayout>
  );
} 