# Documentação de Utilidades de Data (GMT-3)

Este documento explica como utilizar corretamente as funções de manipulação de data disponíveis no arquivo `lib/utils/date.ts`. Todas as funções foram projetadas para lidar com o fuso horário GMT-3 (Brasília), garantindo consistência na exibição e armazenamento de datas em toda a aplicação.

## Índice

1. [Conceitos Fundamentais](#conceitos-fundamentais)
2. [Funções Disponíveis](#funções-disponíveis)
3. [Casos de Uso Comuns](#casos-de-uso-comuns)
4. [Exemplos de Implementação](#exemplos-de-implementação)
5. [Troubleshooting](#troubleshooting)

## Conceitos Fundamentais

### Armazenamento vs. Exibição

- **Armazenamento**: Todas as datas são armazenadas em formato UTC no banco de dados.
- **Exibição**: Todas as datas são convertidas para GMT-3 antes de serem exibidas ao usuário.

### Ciclo de Vida das Datas na Aplicação

1. **Input do Usuário**: O usuário insere datas em GMT-3 (fuso horário local)
2. **Conversão para Armazenamento**: Convertemos para UTC antes de salvar no banco
3. **Armazenamento**: Armazenamos em UTC no banco de dados
4. **Recuperação**: Recuperamos dados em UTC do banco
5. **Exibição**: Convertemos para GMT-3 para exibir ao usuário

## Funções Disponíveis

### `toLocalTime(date: Date | string | null): Date | null`

Converte uma data UTC para o fuso horário GMT-3. Use esta função quando precisar converter datas do banco para exibição.

```typescript
// Exemplo
const utcDate = new Date('2023-06-15T18:00:00Z');
const localDate = toLocalTime(utcDate); 
// Resultado: 2023-06-15T15:00:00 (horário de Brasília)
```

### `toUTCString(date: Date | string | null): string | null`

Converte uma data em GMT-3 para formato UTC com string ISO. Use quando precisar converter datas locais para salvar no banco.

```typescript
// Exemplo
const localDate = new Date('2023-06-15T15:00:00-03:00');
const utcString = toUTCString(localDate); 
// Resultado: "2023-06-15T18:00:00.000Z"
```

### `formatDate(date: Date | string | null, formatString?: string): string`

Formata uma data UTC para exibição, convertendo automaticamente para GMT-3. O formato padrão é "dd 'de' MMMM 'de' yyyy".

```typescript
// Exemplo com formato padrão
formatDate('2023-06-15T18:00:00Z'); 
// Resultado: "15 de junho de 2023"

// Exemplo com formato personalizado
formatDate('2023-06-15T18:00:00Z', 'dd/MM/yyyy HH:mm'); 
// Resultado: "15/06/2023 15:00"
```

### `formatDateTimeInput(date: Date | string | null): string`

Formata uma data UTC para ser usada em inputs do tipo datetime-local, convertendo para GMT-3.

```typescript
// Exemplo
const storedDate = '2023-06-15T18:00:00Z';
formatDateTimeInput(storedDate); 
// Resultado: "2023-06-15T15:00"
```

### `parseInputToUTC(dateTimeString: string): string | null`

Converte uma string de input datetime-local (em GMT-3) para UTC antes de armazenar no banco.

```typescript
// Exemplo
const inputValue = '2023-06-15T15:00';
parseInputToUTC(inputValue); 
// Resultado: "2023-06-15T18:00:00.000Z"
```

### `formatDistanceToNow(date: Date | string | null): string`

Exibe em linguagem natural quanto tempo passou desde uma data, considerando GMT-3.

```typescript
// Exemplo (assumindo que hoje é 17/06/2023)
formatDistanceToNow('2023-06-15T18:00:00Z'); 
// Resultado: "há 2 dias"
```

### `isBeforeNow(date: Date | string | null): boolean`

Verifica se uma data já passou (considerando GMT-3).

```typescript
// Exemplo (assumindo que a data atual é posterior)
isBeforeNow('2023-06-15T18:00:00Z'); 
// Resultado: true (se a data atual for posterior)
```

## Casos de Uso Comuns

### 1. Exibindo Datas em Componentes

Para exibir datas de forma consistente em qualquer componente, utilize a função `formatDate`:

```tsx
import { formatDate } from '@/lib/utils/date';

function EventCard({ event }) {
  return (
    <div className="card">
      <h3>{event.title}</h3>
      <p>Data: {formatDate(event.date, 'dd/MM/yyyy HH:mm')}</p>
    </div>
  );
}
```

### 2. Formulários com Campos de Data

Para trabalhar com inputs de tipo datetime-local em formulários:

```tsx
import { useState } from 'react';
import { formatDateTimeInput, parseInputToUTC } from '@/lib/utils/date';

function EventForm({ initialData, onSubmit }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    date: initialData?.date ? formatDateTimeInput(initialData.date) : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Converte a data para UTC antes de salvar
    const dataToSubmit = {
      ...formData,
      date: parseInputToUTC(formData.date),
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />
      <input 
        type="datetime-local" 
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
      />
      <button type="submit">Salvar</button>
    </form>
  );
}
```

### 3. Contagem Regressiva

Para exibir contagem regressiva até uma data, convertendo de UTC para GMT-3:

```tsx
import { toLocalTime } from '@/lib/utils/date';
import CountdownTimer from '@/components/CountdownTimer';

function EventCountdown({ eventDate }) {
  // Converter a data UTC para GMT-3 para o componente de contagem regressiva
  const localEventDate = toLocalTime(eventDate);
  
  return (
    <div>
      <h3>Tempo restante:</h3>
      {localEventDate && <CountdownTimer targetDate={localEventDate} />}
    </div>
  );
}
```

### 4. Verificações Condicionais de Data

Para verificar se uma data já passou e renderizar componentes diferentes:

```tsx
import { isBeforeNow, formatDate } from '@/lib/utils/date';

function DeadlineDisplay({ deadline }) {
  const isPast = isBeforeNow(deadline);
  
  return (
    <div>
      <p>Data limite: {formatDate(deadline)}</p>
      
      {isPast ? (
        <span className="badge-expired">Prazo encerrado</span>
      ) : (
        <span className="badge-active">Prazo em aberto</span>
      )}
    </div>
  );
}
```

## Exemplos de Implementação

### Componente GameDetailAdmin

```tsx
import { formatDate, formatDateTimeInput, parseInputToUTC } from '@/lib/utils/date';

// Em uma função de salvamento de dados
const onSubmit = async (data: Game) => {
  try {
    // Converter data_inicio para UTC antes de salvar
    const gameData = {
      ...data,
      data_inicio: data.data_inicio ? parseInputToUTC(data.data_inicio as string) : null
    };
    
    // Salvar no banco...
  } catch (error) {
    // Tratamento de erro...
  }
};

// No JSX para exibir a data
return (
  <div>
    <p>Data de início: {formatDate(game.data_inicio, 'dd/MM/yyyy HH:mm')}</p>
    
    {/* Em um formulário */}
    <input
      type="datetime-local"
      value={formatDateTimeInput(game.data_inicio)}
      onChange={(e) => /* lógica de atualização */}
    />
  </div>
);
```

### Componente QuestsAdminClient

```tsx
import { formatDate, formatDateTimeInput, parseInputToUTC } from '@/lib/utils/date';

// Para salvar uma quest
const handleSaveQuest = async () => {
  const questData = {
    // Outros campos...
    data_inicio: formData.data_inicio ? parseInputToUTC(formData.data_inicio) : null,
    data_fim: formData.data_fim ? parseInputToUTC(formData.data_fim) : null,
  };
  
  // Salvar no banco...
};

// No JSX para exibir a lista de quests
return (
  <div>
    {questsList.map(quest => (
      <div key={quest.id}>
        <h3>{quest.titulo}</h3>
        {quest.data_inicio && (
          <p>Início: {formatDate(quest.data_inicio)}</p>
        )}
        {quest.data_fim && (
          <p>Término: {formatDate(quest.data_fim)}</p>
        )}
      </div>
    ))}
  </div>
);
```

## Troubleshooting

### Problema: Datas exibidas com horário incorreto

**Solução**: Certifique-se de que está usando `formatDate()` para exibição e não exibindo a data diretamente.

### Problema: Datas salvas com offset incorreto

**Solução**: Sempre use `parseInputToUTC()` ao salvar datas de formulários para o banco de dados.

### Problema: Comparações de data retornando resultados inesperados

**Solução**: Use `toLocalTime()` para converter datas para GMT-3 antes de compará-las ou utilize `isBeforeNow()` para verificar se uma data já passou.

### Problema: Inputs datetime-local exibindo data/hora errada

**Solução**: Certifique-se de que está utilizando `formatDateTimeInput()` para preencher o valor do input. 