import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Close } from '@mui/icons-material';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';

interface ModalRegistrarPagamentoProps {
  open: boolean;
  onClose: () => void;
  cobrancaId: string;
  supabase: SupabaseClient<Database>;
  onSuccess: () => void;
}

interface FormaPagamento {
  id: string;
  name: string;
  description?: string;
}

export default function ModalRegistrarPagamento({
  open,
  onClose,
  cobrancaId,
  supabase,
  onSuccess
}: ModalRegistrarPagamentoProps) {
  const [loading, setLoading] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formaPagamentoId, setFormaPagamentoId] = useState('');
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [error, setError] = useState('');

  // Carregar formas de pagamento
  useEffect(() => {
    const carregarFormasPagamento = async () => {
      try {
        const { data, error } = await supabase
          .from('config_payment_methods')
          .select('id, name, description')
          .eq('active', true)
          .order('name');

        if (error) throw error;
        setFormasPagamento(data || []);
        if (data && data.length > 0) {
          setFormaPagamentoId(data[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        setError('Erro ao carregar formas de pagamento. Tente novamente.');
      }
    };

    if (open) {
      carregarFormasPagamento();
    }
  }, [open, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('cobranca_integrantes')
        .update({
          status: 'Pago',
          data_pagamento: dataPagamento,
          forma_pagamento_id: formaPagamentoId,
        })
        .eq('id', cobrancaId);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setError('Erro ao registrar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <div className="flex items-center justify-between p-6 pb-4">
        <DialogTitle className="p-0 text-xl font-semibold">
          Registrar Pagamento
        </DialogTitle>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Close />
        </button>
      </div>

      <DialogContent className="p-6 pt-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="dataPagamento" className="block text-sm font-medium text-gray-700">
              Data do Pagamento
            </label>
            <input
              type="date"
              id="dataPagamento"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="formaPagamento" className="block text-sm font-medium text-gray-700">
              Forma de Pagamento
            </label>
            <select
              id="formaPagamento"
              value={formaPagamentoId}
              onChange={(e) => setFormaPagamentoId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {formasPagamento.map((forma) => (
                <option key={forma.id} value={forma.id}>
                  {forma.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrar Pagamento'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 