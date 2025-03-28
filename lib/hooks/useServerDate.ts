import { useState, useEffect } from 'react';

interface ServerDateResponse {
  datetime: string;
  timestamp: number;
  formatted: {
    date: string;
    time: string;
    full: string;
  };
}

interface UseServerDateReturn {
  serverDate: Date | null;
  isLoading: boolean;
  error: Error | null;
  refreshServerDate: () => Promise<void>;
  isDateBeforeServerDate: (date: Date | string | null) => boolean;
  isDateAfterServerDate: (date: Date | string | null) => boolean;
  formatDistanceToServerDate: (date: Date | string | null) => string;
}

/**
 * Hook para obter e gerenciar a data atual do servidor
 * @returns Objeto com a data do servidor e funções auxiliares
 */
export function useServerDate(): UseServerDateReturn {
  const [serverDate, setServerDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServerDate = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/date');
      
      if (!response.ok) {
        throw new Error(`Erro ao obter data do servidor: ${response.statusText}`);
      }
      
      const data: ServerDateResponse = await response.json();
      setServerDate(new Date(data.datetime));
      
      console.log('Data do servidor obtida:', data.formatted.full);
    } catch (err: any) {
      console.error('Erro ao obter data do servidor:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Em caso de erro, usar a data local como fallback
      setServerDate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar a data do servidor no carregamento inicial
  useEffect(() => {
    fetchServerDate();
  }, []);

  // Função para verificar se uma data é anterior à data do servidor
  const isDateBeforeServerDate = (date: Date | string | null): boolean => {
    if (!date) return false;
    
    const compareDate = typeof date === 'string' ? new Date(date) : date;
    const currentDate = serverDate || new Date(); // fallback para data local se a do servidor não estiver disponível
    
    return compareDate < currentDate;
  };

  // Função para verificar se uma data é posterior à data do servidor
  const isDateAfterServerDate = (date: Date | string | null): boolean => {
    if (!date) return false;
    
    const compareDate = typeof date === 'string' ? new Date(date) : date;
    const currentDate = serverDate || new Date();
    
    return compareDate > currentDate;
  };

  // Formatar distância entre uma data e a data do servidor
  const formatDistanceToServerDate = (date: Date | string | null): string => {
    if (!date) return "Data inválida";
    
    try {
      const compareDate = typeof date === 'string' ? new Date(date) : date;
      const currentDate = serverDate || new Date();
      
      // Diferença em milissegundos
      const diff = Math.abs(compareDate.getTime() - currentDate.getTime());
      
      // Calcular dias, horas, minutos
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (compareDate < currentDate) {
        // No passado
        if (days > 0) {
          return `há ${days} dia${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
          return `há ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
          return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
      } else {
        // No futuro
        if (days > 0) {
          return `em ${days} dia${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
          return `em ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
          return `em ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
      }
    } catch (err) {
      console.error('Erro ao calcular distância de data:', err);
      return "Data inválida";
    }
  };

  return {
    serverDate,
    isLoading,
    error,
    refreshServerDate: fetchServerDate,
    isDateBeforeServerDate,
    isDateAfterServerDate,
    formatDistanceToServerDate
  };
} 