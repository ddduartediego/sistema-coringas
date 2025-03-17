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
  FilterList
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import ModalCobranca from './components/ModalCobranca';
import ModalCobrancaIntegrante from './components/ModalCobrancaIntegrante';
import ListaCobrancas from './components/ListaCobrancas';

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
    <div className="mr-4 text-white">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-white opacity-90">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
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
  const [cobrancaIdParaEditar, setCobrancaIdParaEditar] = useState<string | null>(null);
  const [cobrancaIntegranteIdParaEditar, setCobrancaIntegranteIdParaEditar] = useState<string | null>(null);
  
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
  useEffect(() => {
    if (!userData) return;
    
    const loadDashboardData = async () => {
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
    
    loadDashboardData();
  }, [supabase, userData]);
  
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
    setCobrancaIdParaEditar(null);
    setShowModal(true);
  };
  
  // Editar cobrança
  const editarCobranca = (id: string) => {
    console.log('Editando cobrança com ID:', id);
    setCobrancaIntegranteIdParaEditar(id);
    setShowModalIntegrante(true);
  };
  
  // Marcar cobrança como paga
  const marcarComoPago = async (id: string) => {
    try {
      const dataAtual = new Date().toISOString();
      
      await supabase
        .from('cobranca_integrantes')
        .update({
          status: 'Pago',
          data_pagamento: dataAtual
        })
        .eq('id', id);
      
      // Atualizar dados
      atualizarDados();
    } catch (error) {
      console.error('Erro ao marcar cobrança como paga:', error);
      alert('Ocorreu um erro ao marcar a cobrança como paga. Tente novamente.');
    }
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
      
      // Atualizar dados
      atualizarDados();
      alert('Cobrança excluída com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir cobrança:', error);
      alert(`Ocorreu um erro ao excluir a cobrança: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar dados após salvar
  const atualizarDados = () => {
    if (userData) {
      const loadDashboardData = async () => {
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
      
      loadDashboardData();
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
          <button
            onClick={criarNovaCobranca}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
          >
            <Add className="mr-1" />
            Nova Cobrança
          </button>
        </div>
        
        {/* Dashboard de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Valor Total"
            value={formatarValor(dashboardData.valorTotal)}
            icon={<AttachMoney fontSize="large" />}
            bgColor="bg-blue-600"
          />
          <MetricCard
            title="Valor Recebido"
            value={formatarValor(dashboardData.valorRecebido)}
            icon={<CheckCircle fontSize="large" />}
            bgColor="bg-green-600"
          />
          <MetricCard
            title="Valor a Receber"
            value={formatarValor(dashboardData.valorAReceber)}
            icon={<AttachMoney fontSize="large" />}
            bgColor="bg-yellow-600"
          />
          <MetricCard
            title="Valor em Atraso"
            value={formatarValor(dashboardData.valorEmAtraso)}
            icon={<Warning fontSize="large" />}
            bgColor="bg-red-600"
          />
        </div>
        
        {/* Lista de cobranças com filtros */}
        <ListaCobrancas 
          cobrancas={cobrancas}
          integrantes={integrantes}
          onEditarCobranca={editarCobranca}
          onMarcarComoPago={marcarComoPago}
          onExcluirCobranca={excluirCobranca}
        />
        
        {/* Modais */}
        <ModalCobranca
          supabase={supabase}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={atualizarDados}
          cobrancaId={cobrancaIdParaEditar || undefined}
        />
        
        <ModalCobrancaIntegrante
          supabase={supabase}
          isOpen={showModalIntegrante}
          onClose={() => {
            console.log('Fechando modal de cobrança integrante');
            setShowModalIntegrante(false);
            setCobrancaIntegranteIdParaEditar(null);
          }}
          onSave={atualizarDados}
          cobrancaIntegranteId={cobrancaIntegranteIdParaEditar || ''}
        />
      </div>
    </AppLayout>
  );
} 