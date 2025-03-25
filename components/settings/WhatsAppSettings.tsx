'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, Alert, TextField } from '@mui/material';
import { WhatsApp, Warning, PowerSettingsNew, Send } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { WhatsAppService } from '@/services/whatsapp';

const whatsappService = new WhatsAppService();
const QR_CODE_EXPIRATION = 90000; // 1.5 minutos em milissegundos
const STATUS_POLLING_INTERVAL = 10000; // 10 segundos
const WAIT_TIME = 120000; // 2 minutos em milissegundos

interface WhatsAppResponse {
  status: string;
  qrcode?: string;
  lastUpdate?: string;
}

export default function WhatsAppSettings() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'expired'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrCodeExpiresAt, setQrCodeExpiresAt] = useState<Date | null>(null);
  
  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const qrCodeTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadStatus();
    return () => {
      stopPolling();
    };
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar timestamp:', error);
      return timestamp;
    }
  };

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await whatsappService.getStatus();
      
      if (response.status !== status) {
        setStatus(response.status);
        setLastStatus(formatTimestamp(response.lastUpdate));
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      setError('Erro ao carregar status do WhatsApp');
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setGeneratingQR(true);
      setError(null);
      
      // Informa ao usuário que o processo pode demorar até 2 minutos
      setError('Aguarde até 2 minutos enquanto preparamos o QR Code...');
      
      // Faz a requisição imediatamente
      const responsePromise = whatsappService.connect();
      
      // Aguarda no máximo 2 minutos pela resposta
      const response = await Promise.race([
        responsePromise,
        new Promise<WhatsAppResponse>((_, reject) => 
          setTimeout(() => reject(new Error('Tempo limite excedido')), WAIT_TIME)
        )
      ]);
      
      if (response.qrcode) {
        setError(null); // Limpa a mensagem de espera
        setQrCode(response.qrcode);
        setQrCodeExpiresAt(new Date(Date.now() + QR_CODE_EXPIRATION));
        startQRCodeTimer();
        startStatusPolling();
      } else {
        throw new Error('QR Code não disponível');
      }
    } catch (error) {
      console.error('Erro ao iniciar conexão:', error);
      if (error instanceof Error && error.message === 'Tempo limite excedido') {
        setError('O servidor demorou muito para responder. Tente novamente.');
      } else {
        setError('Erro ao iniciar conexão. Tente novamente.');
      }
      setQrCode(null);
      setQrCodeExpiresAt(null);
    } finally {
      setIsConnecting(false);
      setGeneratingQR(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await whatsappService.disconnect();
      setStatus('disconnected');
      setQrCode(null);
      setQrCodeExpiresAt(null);
      setLastStatus(null);
      stopPolling();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setError('Erro ao desconectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const startQRCodeTimer = () => {
    if (qrCodeTimer.current) {
      clearTimeout(qrCodeTimer.current);
    }

    qrCodeTimer.current = setTimeout(() => {
      setStatus('expired');
      setQrCode(null);
      setQrCodeExpiresAt(null);
      stopPolling();
    }, QR_CODE_EXPIRATION);
  };

  const startStatusPolling = useCallback(() => {
    stopPolling();
    pollTimer.current = setInterval(async () => {
      try {
        const response = await whatsappService.getStatus();
        
        // Só atualiza se o status mudou
        if (response.status !== status) {
          setStatus(response.status);
          setLastStatus(formatTimestamp(response.lastUpdate));

          if (response.status === 'connected') {
            setQrCode(null);
            setQrCodeExpiresAt(null);
            stopPolling();
          } else if (response.status === 'disconnected') {
            setQrCode(null);
            setQrCodeExpiresAt(null);
            stopPolling();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        // Não mostra erro visual para falhas de polling
      }
    }, STATUS_POLLING_INTERVAL);
  }, [status]);

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (qrCodeTimer.current) {
      clearTimeout(qrCodeTimer.current);
      qrCodeTimer.current = null;
    }
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Verifica se tem entre 12 e 13 dígitos (código do país + DDD + número)
    return cleanPhone.length >= 12 && cleanPhone.length <= 13;
  };

  const handleSendTestMessage = async () => {
    try {
      setSendingMessage(true);
      setError(null);
      setMessageSent(false);
      
      // Validação do número de telefone
      if (!validatePhoneNumber(testPhone)) {
        throw new Error('Número de telefone inválido. Digite o número com código do país e DDD (ex: 5511999999999)');
      }

      if (!testMessage.trim()) {
        throw new Error('A mensagem não pode estar vazia');
      }

      // Remove caracteres não numéricos do telefone
      const cleanPhone = testPhone.replace(/\D/g, '');

      await whatsappService.sendTestMessage(cleanPhone, testMessage.trim());
      setMessageSent(true);
      setTestPhone('');
      setTestMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao enviar mensagem de teste');
      }
      setMessageSent(false);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <WhatsApp color={status === 'connected' ? 'success' : 'error'} />
          <Typography variant="h6">
            Status: {
              status === 'connected' ? 'Conectado' :
              status === 'connecting' ? 'Conectando...' :
              status === 'expired' ? 'QR Code Expirado' :
              'Desconectado'
            }
            {lastStatus && ` (${lastStatus})`}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {status === 'connected' ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<PowerSettingsNew />}
            onClick={handleDisconnect}
            disabled={loading}
          >
            Desconectar WhatsApp
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={generatingQR ? <CircularProgress size={20} color="inherit" /> : <WhatsApp />}
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {generatingQR ? 'Gerando QR Code...' : 'Conectar WhatsApp'}
          </Button>
        )}
      </Paper>

      {generatingQR && !qrCode && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress />
            <Typography variant="body1">
              Gerando QR Code para conexão...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Por favor, aguarde enquanto preparamos a conexão.
            </Typography>
          </Box>
        </Paper>
      )}

      {qrCode && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Escaneie o QR Code
          </Typography>
          <Box display="flex" justifyContent="center" mb={2}>
            <div style={{ 
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '8px',
              backgroundColor: '#fff',
              width: '216px',
              height: '216px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <QRCodeSVG
                value={`${qrCode}?t=${Date.now()}`}
                size={200}
                level="H"
                includeMargin={true}
                style={{
                  width: '200px',
                  height: '200px'
                }}
                key={Date.now()}
              />
            </div>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Abra o WhatsApp no seu celular, toque em Menu ou Configurações e selecione WhatsApp Web/Desktop.
            Escaneie o QR Code acima para conectar.
          </Typography>
          {qrCodeExpiresAt && (
            <Box mt={1}>
              <Typography variant="body2" color="text.secondary">
                Este QR Code expira em {new Date(qrCodeExpiresAt).toLocaleTimeString()}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {status === 'connected' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Enviar Mensagem de Teste
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Número do Telefone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="5511999999999"
              helperText="Digite o número com código do país (55) e DDD, sem espaços ou caracteres especiais"
              error={testPhone.length > 0 && !validatePhoneNumber(testPhone)}
              disabled={sendingMessage}
            />
            <TextField
              label="Mensagem"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              multiline
              rows={3}
              disabled={sendingMessage}
              error={testMessage.length > 0 && !testMessage.trim()}
              helperText={testMessage.length > 0 && !testMessage.trim() ? 'A mensagem não pode estar vazia' : ''}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={sendingMessage ? <CircularProgress size={20} color="inherit" /> : <Send />}
              onClick={handleSendTestMessage}
              disabled={sendingMessage || !validatePhoneNumber(testPhone) || !testMessage.trim()}
            >
              {sendingMessage ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
            {messageSent && (
              <Alert severity="success">
                Mensagem enviada com sucesso!
              </Alert>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
} 