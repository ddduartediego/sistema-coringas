# Configuração das Tabelas do Módulo GameRun Admin

Este documento descreve como configurar as tabelas necessárias para o módulo GameRun Admin no Supabase.

## Estrutura de Dados

O módulo GameRun Admin utiliza três tabelas principais:

1. **games** - Armazena informações sobre os jogos/games disponíveis
2. **game_equipes** - Armazena as equipes participantes de cada game
3. **equipe_integrantes** - Armazena os integrantes de cada equipe

### Tabela `games`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do game (chave primária) |
| titulo | TEXT | Título do game |
| descricao_curta | TEXT | Descrição curta para exibição nos cards |
| descricao | TEXT | Descrição completa do game |
| quantidade_integrantes | INTEGER | Quantidade de integrantes permitidos por equipe |
| data_inicio | TIMESTAMP WITH TIME ZONE | Data e hora de início do game |
| imagem_url | TEXT | URL da imagem do game |
| status | TEXT | Status do game (pendente, ativo, inativo, encerrado) |
| created_at | TIMESTAMP WITH TIME ZONE | Data e hora de criação do registro |
| updated_at | TIMESTAMP WITH TIME ZONE | Data e hora da última atualização do registro |

### Tabela `game_equipes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da equipe (chave primária) |
| game_id | UUID | Referência ao game que a equipe pertence (chave estrangeira) |
| nome | TEXT | Nome da equipe |
| status | TEXT | Status da equipe (pendente, ativa, rejeitada) |
| lider_id | UUID | Referência ao profile do líder da equipe (chave estrangeira) |
| created_at | TIMESTAMP WITH TIME ZONE | Data e hora de criação do registro |
| updated_at | TIMESTAMP WITH TIME ZONE | Data e hora da última atualização do registro |

### Tabela `equipe_integrantes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do relacionamento (chave primária) |
| equipe_id | UUID | Referência à equipe que o integrante pertence (chave estrangeira) |
| integrante_id | UUID | Referência ao profile do integrante (chave estrangeira) |
| status | TEXT | Status do integrante na equipe (pendente, ativo, removido) |
| created_at | TIMESTAMP WITH TIME ZONE | Data e hora de criação do registro |
| updated_at | TIMESTAMP WITH TIME ZONE | Data e hora da última atualização do registro |

## Políticas de Segurança (RLS)

O script configura políticas de segurança em nível de linha (Row Level Security) para controlar o acesso às tabelas:

### Para a tabela `games`:
- Administradores têm acesso total
- Usuários comuns só podem visualizar games com status "ativo"

### Para a tabela `game_equipes`:
- Administradores têm acesso total
- Líderes podem gerenciar suas próprias equipes
- Usuários comuns podem visualizar equipes de games ativos

### Para a tabela `equipe_integrantes`:
- Administradores têm acesso total
- Líderes podem gerenciar os integrantes de suas equipes
- Usuários podem gerenciar sua própria participação

## Como Executar o Script

Para configurar as tabelas no Supabase, siga estes passos:

1. Faça login no [Dashboard do Supabase](https://app.supabase.io/)
2. Selecione o projeto do Sistema Coringas
3. No menu lateral, clique em **Table Editor**
4. Clique no botão **SQL Editor** (ou acesse diretamente em **SQL Editor** no menu lateral)
5. Crie uma nova consulta clicando em **New Query**
6. Cole o conteúdo do arquivo `scripts/create_gamerun_tables.sql` no editor
7. Clique em **Run** para executar o script

## Verificação

Após executar o script, você deve verificar se:

1. As três tabelas (`games`, `game_equipes` e `equipe_integrantes`) foram criadas corretamente
2. Os índices foram criados para otimizar as consultas
3. As políticas de segurança (RLS) foram aplicadas corretamente
4. Os triggers para atualização automática de `updated_at` estão funcionando

Você pode testar inserindo alguns registros de exemplo e verificando se as restrições de chave estrangeira e as políticas de segurança estão funcionando corretamente.

## Próximos Passos

Após configurar as tabelas, você pode:

1. Iniciar a aplicação e acessar o módulo GameRun Admin
2. Criar novos games através da interface
3. Testar a funcionalidade de ativação de games
4. Configurar o fluxo de inscrição de equipes (em desenvolvimento) 