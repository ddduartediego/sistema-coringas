# Guia de Padronização do Supabase

Este guia estabelece padrões para o uso da biblioteca Supabase no projeto Sistema Coringas.

## Visão Geral

Estamos utilizando o Supabase através da biblioteca `@supabase/ssr` (Server-Side Rendering), que substitui a antiga biblioteca `@supabase/auth-helpers-nextjs`. 

## Funções Padronizadas

Criamos funções padronizadas para facilitar a integração do Supabase em diferentes contextos:

### Cliente (Client-side)

```typescript
// Em Client Components:
import { createClientSupabaseClient } from '@/lib/supabase/client';

export default function MeuComponente() {
  const supabase = createClientSupabaseClient();
  
  // Usar o cliente...
}
```

#### Instância Global

Para operações gerais do cliente:

```typescript
import { supabase } from '@/lib/supabase/client';

// Usar diretamente...
const { data, error } = await supabase.from('tabela').select('*');
```

### Servidor (Server-side)

```typescript
// Em Server Components:
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function MeuServerComponente() {
  const supabase = await createServerSupabaseClient();
  
  // Usar o cliente...
}
```

### Route Handlers

```typescript
// Em Route Handlers (API Routes):
import { createRouteSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createRouteSupabaseClient();
  
  // Usar o cliente...
}
```

## Tratamento de Tipos

Nossos clientes Supabase são tipados utilizando o tipo `Database` definido em `@/lib/database.types`. Isto garante verificação estática de tipo para as tabelas, colunas e relacionamentos.

```typescript
// As funções retornam clientes já tipados:
const supabase = createClientSupabaseClient();
const { data } = await supabase.from('games').select('*');
// data é tipado de acordo com a tabela 'games'
```

## Autenticação

A autenticação é gerenciada através dos mesmos clientes, sem necessidade de funções adicionais:

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Obter sessão atual
const { data: { session } } = await supabase.auth.getSession();

// Logout
await supabase.auth.signOut();
```

## Migração do Código Existente

Se você encontrar código que ainda usa a biblioteca antiga (`@supabase/auth-helpers-nextjs`), atualize-o seguindo esta tabela de equivalências:

| Função Antiga | Função Nova |
|---------------|-------------|
| `createClientComponentClient` | `createClientSupabaseClient` |
| `createServerComponentClient` | `createServerSupabaseClient` |
| `createRouteHandlerClient` | `createRouteSupabaseClient` |

## Lidando com Cookies e Cache

As funções do servidor (`createServerSupabaseClient` e `createRouteSupabaseClient`) já gerenciam cookies automaticamente. Não é necessário passar o objeto `cookies()` manualmente.

```typescript
// ❌ NÃO FAÇA ISSO:
const cookieStore = cookies();
const supabase = createServerSupabaseClient(cookieStore);

// ✅ FAÇA ISTO:
const supabase = await createServerSupabaseClient();
```

## Tratamento de Erros

Ao lidar com operações do Supabase, sempre verifique os erros retornados:

```typescript
const { data, error } = await supabase.from('games').select('*');

if (error) {
  console.error('Erro ao carregar games:', error);
  // Tratar o erro apropriadamente
  return;
}

// Continuar com os dados...
``` 