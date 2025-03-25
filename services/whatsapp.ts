const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'https://whatsapp-coringas-api-production.up.railway.app';
const API_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`
};

interface StatusResponse {
  status: string;
  timestamp: string;
  whatsapp: string;
  port: string;
}

interface WhatsAppStatus {
  status: 'connected' | 'connecting' | 'disconnected';
  lastUpdate: string;
}

export class WhatsAppService {
  async getStatus(): Promise<WhatsAppStatus> {
    try {
      const response = await fetch(`${API_URL}/status`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Falha ao obter status');
      }

      const data: StatusResponse = await response.json();
      
      // Mapeia o status da API para o formato interno
      return {
        status: data.whatsapp as 'connected' | 'connecting' | 'disconnected',
        lastUpdate: data.timestamp
      };
    } catch (error) {
      console.error('Erro ao obter status:', error);
      throw error;
    }
  }

  async connect() {
    try {
      const response = await fetch(`${API_URL}/whatsapp/qrcode`, {
        method: 'POST',
        headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Falha ao iniciar conexão');
      }

      const data = await response.json();
      return {
        status: 'connecting',
        qrcode: data.qrcode,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao iniciar conexão:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      console.log('Iniciando desconexão...');
      const response = await fetch(`${API_URL}/whatsapp/disconnect`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) {
        console.error('Erro na resposta da desconexão:', response.status, response.statusText);
        throw new Error('Erro ao desconectar');
      }
      const data = await response.json();
      console.log('Resposta da desconexão:', data);
      return data;
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      throw new Error('Erro ao desconectar');
    }
  }

  async sendTestMessage(phone: string, message: string) {
    try {
      const response = await fetch(`${API_URL}/send-message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          number: phone,
          message: message
        }),
      });

      // Trata os diferentes códigos de resposta
      if (response.status === 503) {
        throw new Error('WhatsApp não está conectado. Conecte o WhatsApp antes de enviar mensagens.');
      } else if (response.status === 400) {
        throw new Error('Dados inválidos. Verifique o número e a mensagem.');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Token inválido ou sem permissão.');
      } else if (!response.ok) {
        throw new Error('Erro ao enviar mensagem.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
} 