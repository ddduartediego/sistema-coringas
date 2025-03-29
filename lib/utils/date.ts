import { format as fnsFormat, formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Constante para o fuso GMT-3 em minutos (-180 minutos ou -3 horas)
 * Este valor é usado internamente para todas as conversões de fuso horário
 */
const GMT_MINUS_3_OFFSET = -3 * 60;

/**
 * Converte uma data UTC para o fuso horário GMT-3 (Brasília)
 * 
 * Esta função deve ser usada quando precisamos exibir datas armazenadas em UTC
 * no fuso horário local brasileiro (GMT-3) para apresentação ao usuário.
 * 
 * @example
 * // Converte uma data UTC para GMT-3
 * const utcDate = new Date('2023-05-20T15:00:00Z');
 * const localDate = toLocalTime(utcDate); // Resultado: 2023-05-20T12:00:00 (GMT-3)
 * 
 * @param date Data em formato UTC (ISO string ou objeto Date)
 * @returns Objeto Date ajustado para GMT-3 ou null se o parâmetro for null
 */
export function toLocalTime(date: Date | string | null): Date | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // Ajusta para GMT-3 adicionando manualmente -3 horas
  const userTimezoneOffset = GMT_MINUS_3_OFFSET;
  const utcDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
  return new Date(utcDate.getTime() + userTimezoneOffset * 60000);
}

/**
 * Converte uma data local (GMT-3) para UTC para armazenamento
 * 
 * Esta função deve ser usada quando precisamos converter uma data de entrada do usuário
 * (que está em fuso GMT-3) para UTC antes de armazená-la no banco de dados.
 * 
 * @example
 * // Converte uma data GMT-3 para UTC para armazenamento
 * const localDate = new Date('2023-05-20T12:00:00-03:00');
 * const utcString = toUTCString(localDate); // Resultado: "2023-05-20T15:00:00.000Z"
 * 
 * @param date Data em formato local (GMT-3)
 * @returns String ISO para armazenamento UTC ou null se o parâmetro for null
 */
export function toUTCString(date: Date | string | null): string | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  return dateObj.toISOString();
}

/**
 * Formata uma data ISO ou objeto Date para exibição, considerando GMT-3
 * 
 * Use esta função para qualquer formatação de data que será exibida ao usuário.
 * Ela converte automaticamente a data de UTC para GMT-3 e então aplica a formatação.
 * 
 * @example
 * // Formata uma data UTC para exibição em GMT-3
 * const utcDate = '2023-05-20T15:00:00Z';
 * 
 * // Formato padrão: "20 de maio de 2023"
 * formatDate(utcDate); 
 * 
 * // Formato personalizado: "20/05/2023 12:00"
 * formatDate(utcDate, 'dd/MM/yyyy HH:mm');
 * 
 * @param date Data em formato UTC (ISO string ou objeto Date)
 * @param formatString String de formato (seguindo o padrão da biblioteca date-fns)
 * @returns String formatada com a data já convertida para GMT-3
 */
export function formatDate(
  date: Date | string | null, 
  formatString: string = "dd 'de' MMMM 'de' yyyy"
): string {
  if (!date) return '';
  
  const localDate = toLocalTime(date);
  if (!localDate) return '';
  
  return fnsFormat(localDate, formatString, { locale: ptBR });
}

/**
 * Formata uma data para entrada em campos datetime-local (formulários)
 * 
 * Esta função deve ser usada quando precisamos preencher campos de tipo datetime-local 
 * em formulários HTML. Ela converte a data de UTC para GMT-3 e a formata no padrão
 * esperado por inputs datetime-local: "yyyy-MM-ddTHH:mm".
 * 
 * @example
 * // Em um componente React:
 * const [startDate, setStartDate] = useState('2023-05-20T15:00:00Z');
 * 
 * // Uso no JSX:
 * <input 
 *   type="datetime-local" 
 *   value={formatDateTimeInput(startDate)}
 *   onChange={(e) => setStartDate(e.target.value)} 
 * />
 * // Resultado exibido no input: "2023-05-20T12:00"
 * 
 * @param date Data em formato UTC (ISO string ou objeto Date)
 * @returns String no formato "yyyy-MM-ddTHH:mm" para usar em inputs datetime-local
 */
export function formatDateTimeInput(date: Date | string | null): string {
  if (!date) return '';
  
  const localDate = toLocalTime(date);
  if (!localDate) return '';
  
  return fnsFormat(localDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Converte uma string de input datetime-local para ISO string UTC para armazenamento
 * 
 * Esta função deve ser usada quando recebemos um valor de um campo datetime-local
 * e precisamos convertê-lo para UTC antes de salvar no banco de dados.
 * 
 * IMPORTANTE: Esta função assume que o input está em GMT-3 (hora do Brasil)
 * e o converte para UTC para armazenamento.
 * 
 * @example
 * // Em um formulário, ao salvar:
 * const formData = {
 *   // ... outros campos
 *   data_inicio: parseInputToUTC(formValues.data_inicio),
 * };
 * 
 * // Exemplo: input "2023-05-20T12:00" (GMT-3) será convertido para "2023-05-20T15:00:00.000Z" (UTC)
 * 
 * @param dateTimeString String do input no formato "yyyy-MM-ddTHH:mm"
 * @returns ISO string no formato UTC para armazenamento
 */
export function parseInputToUTC(dateTimeString: string): string | null {
  if (!dateTimeString) return null;
  
  // Criar um objeto Date a partir da string de entrada (assumindo que já está em GMT-3)
  const [datePart, timePart] = dateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Criar uma data em GMT-3
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Ajustar para UTC para armazenamento
  return localDate.toISOString();
}

/**
 * Formata a distância de uma data até agora (ex: "há 2 dias", "há 5 minutos")
 * 
 * Esta função é útil para mostrar quanto tempo passou desde uma determinada data,
 * em linguagem natural. A data de entrada é convertida de UTC para GMT-3.
 * 
 * @example
 * // Para uma data de 2 dias atrás (em UTC)
 * const date = '2023-05-18T15:00:00Z'; // Supondo que hoje seja 2023-05-20
 * formatDistanceToNow(date); // Resultado: "há 2 dias"
 * 
 * // Para uma data muito recente
 * const recentDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás
 * formatDistanceToNow(recentDate); // Resultado: "há 5 minutos"
 * 
 * @param date Data em formato UTC (ISO string ou objeto Date)
 * @returns String formatada com a distância temporal em português
 */
export function formatDistanceToNow(date: Date | string | null): string {
  if (!date) return '';
  
  const localDate = toLocalTime(date);
  if (!localDate) return '';
  
  return fnsFormatDistanceToNow(localDate, {
    addSuffix: true,
    locale: ptBR
  });
}

/**
 * Compara se uma data é antes da data atual, considerando GMT-3
 * 
 * Esta função é útil para verificar se um prazo já expirou ou se um evento
 * já passou. A data de entrada é convertida de UTC para GMT-3 antes da comparação.
 * 
 * @example
 * // Verificar se um prazo de uma quest já passou
 * const deadlineDate = '2023-05-18T23:59:59Z';
 * if (isBeforeNow(deadlineDate)) {
 *   console.log('O prazo já expirou!');
 * } else {
 *   console.log('Ainda há tempo disponível.');
 * }
 * 
 * // Em JSX condicional
 * {isBeforeNow(event.date) 
 *   ? <span className="text-red-500">Evento encerrado</span>
 *   : <span className="text-green-500">Evento em andamento</span>
 * }
 * 
 * @param date Data em formato UTC (ISO string ou objeto Date) 
 * @returns true se a data for anterior à data atual
 */
export function isBeforeNow(date: Date | string | null): boolean {
  if (!date) return false;
  
  const localDate = toLocalTime(date);
  if (!localDate) return false;
  
  const now = new Date();
  return localDate < now;
} 