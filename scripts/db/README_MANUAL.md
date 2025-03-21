# Instruções para Alterações Manuais no Banco de Dados

Este projeto não utiliza migrations automatizadas. Todas as alterações no banco de dados devem ser realizadas manualmente através do painel administrativo do Supabase.

## Adição do campo "tipo" na tabela games

Para adicionar o campo "tipo" e configurar os tipos de games, siga estas etapas:

### 1. Adicionar a coluna "tipo" à tabela games

Execute este SQL no Editor SQL do Supabase:

```sql
-- Adicionar coluna tipo à tabela games
ALTER TABLE games ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Online';

-- Atualizar todos os registros existentes para ter um valor padrão
UPDATE games SET tipo = 'Online' WHERE tipo IS NULL;

-- Comentário para a coluna
COMMENT ON COLUMN games.tipo IS 'Tipo do game: Online, Presencial, etc';
```

### 2. Criar a tabela de configurações para tipos de games

Execute este SQL no Editor SQL do Supabase:

```sql
-- Criar tabela de configurações para tipos de games (se ainda não existir)
CREATE TABLE IF NOT EXISTS configuracoes_game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar restrição única à coluna tipo
ALTER TABLE configuracoes_game ADD CONSTRAINT configuracoes_game_tipo_key UNIQUE (tipo);

-- Comentário para a tabela
COMMENT ON TABLE configuracoes_game IS 'Tabela para armazenar configurações relacionadas a games';
```

### 3. Inserir valores padrão para tipos de games

Execute este SQL no Editor SQL do Supabase:

```sql
-- Inserir valores padrão para tipos
INSERT INTO configuracoes_game (tipo, descricao, ativo)
VALUES 
    ('Online', 'Game totalmente online', TRUE),
    ('Presencial', 'Game presencial', TRUE),
    ('Híbrido', 'Game com atividades online e presenciais', TRUE)
ON CONFLICT (tipo) DO NOTHING;
```

### 4. Configurar permissões de acesso (RLS)

Para a tabela `configuracoes_game`, configure as políticas de Row Level Security (RLS):

1. Acesse o painel do Supabase
2. Vá para a seção "Authentication" → "Policies"
3. Selecione a tabela `configuracoes_game`
4. Ative o RLS (se ainda não estiver ativado)
5. Adicione as seguintes políticas:

**Política para SELECT (leitura):**
- Nome: `Permitir leitura para todos`
- Operação: SELECT
- Usando expressão: `true`

**Política para INSERT/UPDATE/DELETE (administradores):**
- Nome: `Permitir gerenciamento para administradores`
- Operação: ALL
- Usando expressão: `auth.uid() IN (SELECT user_id FROM admin_users)`

> Nota: A tabela `admin_users` deve existir e conter os IDs dos usuários com privilégios administrativos.

## Verificação de Alterações

Para verificar se as alterações foram aplicadas corretamente, execute:

```sql
-- Verificar estrutura da tabela games
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'games'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela configuracoes_game
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'configuracoes_game'
ORDER BY ordinal_position;

-- Verificar valores inseridos
SELECT * FROM configuracoes_game;
```

## Reverter Alterações (se necessário)

Para reverter as alterações, execute:

```sql
-- Remover coluna tipo da tabela games
ALTER TABLE games DROP COLUMN IF EXISTS tipo;

-- Remover tabela de configurações
DROP TABLE IF EXISTS configuracoes_game;
``` 