import { useState } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import ModalRegistrarPagamento from './ModalRegistrarPagamento';

// Definindo um tipo customizado que representa os dados da cobrança como usados na aplicação
interface Cobranca {
  id: string;
  cobrancaId?: string;
  nome: string;
  valor: number;
  mes_vencimento: number;
  ano_vencimento: number;
  status: string;
  integrante?: string;
  integranteId?: string;
}

interface TabelaCobrancasProps {
  supabase: SupabaseClient<Database>;
  cobrancas: Cobranca[];
  carregarCobrancas: () => void;
  handleEditarCobranca: (cobranca: Cobranca) => void;
}

export default function TabelaCobrancas({ 
  supabase, 
  cobrancas,
  carregarCobrancas,
  handleEditarCobranca 
}: TabelaCobrancasProps) {
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<string | null>(null);
  const [modalRegistrarPagamentoAberto, setModalRegistrarPagamentoAberto] = useState(false);

  const handleMarcarComoPago = (cobrancaId: string) => {
    setCobrancaSelecionada(cobrancaId);
    setModalRegistrarPagamentoAberto(true);
  };

  const handleRegistroPagamentoSucesso = () => {
    carregarCobrancas();
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarMes = (mes: number | undefined) => {
    if (!mes) return '01'; // Valor padrão se o mês for undefined
    return mes.toString().padStart(2, '0');
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Nome</TableCell>
          <TableCell>Valor</TableCell>
          <TableCell>Vencimento</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Ações</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {cobrancas.map((cobranca) => (
          <TableRow key={cobranca.id}>
            <TableCell>{cobranca.nome}</TableCell>
            <TableCell>{formatarMoeda(cobranca.valor || 0)}</TableCell>
            <TableCell>{`${formatarMes(cobranca.mes_vencimento)}/${cobranca.ano_vencimento || new Date().getFullYear()}`}</TableCell>
            <TableCell>{cobranca.status}</TableCell>
            <TableCell align="right">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleMarcarComoPago(cobranca.id)}
                  disabled={cobranca.status === 'Pago'}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    cobranca.status === 'Pago'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Marcar como pago
                </button>
                <button
                  onClick={() => handleEditarCobranca(cobranca)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200"
                >
                  Editar
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      {/* Modal de Registro de Pagamento */}
      {cobrancaSelecionada && (
        <ModalRegistrarPagamento
          open={modalRegistrarPagamentoAberto}
          onClose={() => {
            setModalRegistrarPagamentoAberto(false);
            setCobrancaSelecionada(null);
          }}
          cobrancaId={cobrancaSelecionada}
          supabase={supabase}
          onSuccess={handleRegistroPagamentoSucesso}
        />
      )}
    </Table>
  );
} 