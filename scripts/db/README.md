# Migrações de Banco de Dados

Este diretório contém scripts SQL para migrações de banco de dados do projeto GameRun.

## Como executar uma migração

### 1. Primeiro, crie a função execute_sql no Supabase

Execute o script `create_execute_sql_function.sql` diretamente no console SQL do Supabase:

```sql
-- Este script cria uma função que permite executar SQL dinâmico via API
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Executar a consulta SQL dinâmica
  EXECUTE sql_query;
  
  -- Retornar o resultado
  result := jsonb_build_object('status', 'success');
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Capturar e retornar qualquer erro
  result := jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
  
  RETURN result;
END;
$$;
```

### 2. Executar a migração via API

Você pode executar a migração fazendo uma requisição POST para o endpoint `/api/db/migration`:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"scriptName": "add_tipo_to_games", "adminKey": "sua_chave_de_servico_do_supabase"}' \
  http://localhost:3000/api/db/migration
```

Ou usando JavaScript:

```javascript
const response = await fetch('/api/db/migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scriptName: 'add_tipo_to_games',
    adminKey: 'sua_chave_de_servico_do_supabase'
  })
});

const result = await response.json();
console.log(result);
```

## Migrações disponíveis

### add_tipo_to_games

Adiciona o campo `tipo` à tabela `games` e cria uma tabela de configurações para os tipos de games.

```bash
# Executar via API
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"scriptName": "add_tipo_to_games", "adminKey": "sua_chave_de_servico_do_supabase"}' \
  http://localhost:3000/api/db/migration
```

## Observações de Segurança

- A função `execute_sql` é definida como `SECURITY DEFINER`, o que significa que ela executa com os privilégios do usuário que a criou. Isso é necessário para que os scripts possam executar comandos como `ALTER TABLE`.
- A API de migração requer uma chave de serviço do Supabase para autenticação. Esta chave deve ser mantida em segredo.
- Certifique-se de revisar cada script de migração antes de executá-lo para evitar alterações indesejadas no banco de dados. 