import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  TextField
} from '@mui/material';
import { WhatsApp } from '@mui/icons-material';

interface ModalEnviarMensagemWhatsAppProps {
  open: boolean;
  onClose: () => void;
  cobranca: {
    nome: string;
    valor: number;
    mesVencimento: number;
    anoVencimento: number;
    integrante: string;
    whatsapp_number: string | null;
  };
  onConfirm: (mensagem: string) => Promise<void>;
}

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const formatarMes = (mes: number) => {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes - 1];
};

export default function ModalEnviarMensagemWhatsApp({
  open,
  onClose,
  cobranca,
  onConfirm
}: ModalEnviarMensagemWhatsAppProps) {
  const [enviando, setEnviando] = useState(false);
  const [mensagemEnviada, setMensagemEnviada] = useState(false);
  const [mensagemEditada, setMensagemEditada] = useState(
    `Olá ${cobranca.integrante}!\n\n_Existe um pagamento pendente:_\n*Cobrança*: ${cobranca.nome}\n*Vencimento*: ${formatarMes(cobranca.mesVencimento)} de ${cobranca.anoVencimento}\n*Valor*: ${formatarMoeda(cobranca.valor)}\n\nCaso tenha alguma dúvida, responda esta mensagem.`
  );

  const handleConfirm = async () => {
    try {
      setEnviando(true);
      await onConfirm(mensagemEditada);
      setMensagemEnviada(true);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setEnviando(false);
    }
  };

  if (mensagemEnviada) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Mensagem Enviada</DialogTitle>
        <DialogContent>
          <Typography>Mensagem enviada com sucesso!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WhatsApp color="success" />
          Enviar Mensagem WhatsApp
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Integrante: {cobranca.integrante}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Cobrança: {cobranca.nome}
          </Typography>
        </Box>
        <Typography variant="subtitle2" gutterBottom>
          Mensagem que será enviada:
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
          Dica: Use _texto_ para itálico e *texto* para negrito
        </Typography>
        <TextField
          multiline
          rows={8}
          fullWidth
          value={mensagemEditada}
          onChange={(e) => setMensagemEditada(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Typography variant="subtitle2" gutterBottom>
          Pré-visualização:
        </Typography>
        <Box
          sx={{
            backgroundColor: '#DCF8C6', // Cor de fundo similar ao WhatsApp
            p: 2,
            borderRadius: 1,
            whiteSpace: 'pre-line',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {mensagemEditada.split('\n').map((linha, index) => {
            // Aplicar formatação de negrito
            let textoFormatado = linha.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
            // Aplicar formatação de itálico
            textoFormatado = textoFormatado.replace(/_(.*?)_/g, '<em>$1</em>');
            
            return (
              <Typography
                key={index}
                dangerouslySetInnerHTML={{ __html: textoFormatado }}
                sx={{ mb: 0.5 }}
              />
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={enviando}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={enviando}
          startIcon={enviando ? <CircularProgress size={20} /> : <WhatsApp />}
        >
          {enviando ? 'Enviando...' : 'Enviar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 