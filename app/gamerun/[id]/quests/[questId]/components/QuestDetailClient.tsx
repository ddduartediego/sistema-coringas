import { formatDate, formatDistanceToNow, isBeforeNow } from '@/lib/utils/date';

export default function QuestDetailClient({ gameId, questId, supabase }: QuestDetailClientProps) {
  // ... existing state and hooks ...

  // Funções de formatação de data
  const formatarData = (dataString: string | null) => {
    return formatDate(dataString, "dd 'de' MMMM 'de' yyyy 'às' HH:mm");
  };
  
  const formatarDistanciaParaAgora = (dataString: string) => {
    return formatDistanceToNow(dataString);
  };
  
  const verificarDataPassada = (dataString: string | null) => {
    return isBeforeNow(dataString);
  };

  // ... existing code ...

  // No JSX, substituir todas as ocorrências das funções antigas pelas novas
  return (
    <div className="container mx-auto py-8">
      {/* ... existing JSX ... */}
      
      {/* Onde houver datas sendo formatadas, usar as novas funções */}
      {quest?.data_inicio && (
        <p className="text-sm text-gray-500">
          Disponível desde {formatarData(quest.data_inicio)}
          {quest.created_at && ` (${formatarDistanciaParaAgora(quest.created_at)})`}
        </p>
      )}
      
      {quest?.data_fim && (
        <p className={`text-sm ${verificarDataPassada(quest.data_fim) ? 'text-red-500' : 'text-gray-500'}`}>
          {verificarDataPassada(quest.data_fim) 
            ? `Prazo encerrado em ${formatarData(quest.data_fim)}`
            : `Prazo final: ${formatarData(quest.data_fim)}`}
        </p>
      )}
      
      {/* ... remaining JSX ... */}
    </div>
  );
} 