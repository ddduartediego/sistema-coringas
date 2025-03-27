# Configuração de Upload de PDFs no Sistema Coringas

Este documento descreve os passos necessários para configurar corretamente o upload e armazenamento de arquivos PDF no sistema Coringas.

## 1. Configuração do Bucket no Supabase

### 1.1. Criar o Bucket

1. Acesse o Supabase Dashboard em https://app.supabase.io/
2. Selecione seu projeto
3. Vá para a seção **Storage** no menu lateral
4. Clique em **New Bucket**
5. Nomeie o bucket como `quest-pdfs`
6. Marque a opção **Public Bucket** (isso permite acesso público aos arquivos)
7. Clique em **Create bucket**

### 1.2. Configurar Políticas de Acesso (RLS)

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- Habilitar RLS no bucket
ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública dos arquivos no bucket quest-pdfs
CREATE POLICY "Permitir leitura pública dos PDFs" ON "storage"."objects"
FOR SELECT
USING (bucket_id = 'quest-pdfs');

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Permitir upload por usuários autenticados" ON "storage"."objects"
FOR INSERT
WITH CHECK (
  bucket_id = 'quest-pdfs' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir atualização por usuários autenticados
CREATE POLICY "Permitir atualização por usuários autenticados" ON "storage"."objects"
FOR UPDATE
USING (
  bucket_id = 'quest-pdfs'
  AND auth.role() = 'authenticated'
);

-- Política para permitir remoção por usuários autenticados
CREATE POLICY "Permitir remoção por usuários autenticados" ON "storage"."objects"
FOR DELETE
USING (
  bucket_id = 'quest-pdfs'
  AND auth.role() = 'authenticated'
);
```

## 2. Alteração do Banco de Dados

Execute o script SQL abaixo no **SQL Editor** do Supabase para adicionar a coluna `arquivo_pdf` à tabela `quests`:

```sql
-- Adicionar campo arquivo_pdf (TEXT) à tabela quests
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "arquivo_pdf" TEXT;

-- Adicionar comentário ao novo campo
COMMENT ON COLUMN "quests"."arquivo_pdf" IS 'URL ou caminho para o arquivo PDF da quest';
```

## 3. Resolução de Problemas Comuns

### 3.1. Erro "Error: Erro ao fazer upload do PDF: {}"

Este erro geralmente indica um dos seguintes problemas:

1. **O bucket `quest-pdfs` não existe**: Verifique se você criou o bucket com o nome exato `quest-pdfs`.

2. **Políticas RLS inadequadas**: Verifique se você configurou as políticas RLS conforme indicado acima.

3. **Usuário não autenticado**: Certifique-se de que o usuário está corretamente autenticado no sistema. Faça logout e login novamente se necessário.

4. **MIME Type não permitido**: Verifique se o arquivo é realmente um PDF. Se necessário, adicione uma restrição de MIME type no bucket:
   - Na interface do bucket, clique em **Settings**
   - Em **Allowed MIME Types**, adicione `application/pdf`

### 3.2. Verificação de Autenticação

Para verificar se o usuário está autenticado corretamente, abra o console do navegador (F12) e execute:

```javascript
const { data, error } = await window.supabase.auth.getSession();
console.log(data, error);
```

Se `data.session` for `null`, o usuário não está autenticado corretamente.

## 4. Verificação da Configuração

Para verificar se a configuração está correta:

1. Acesse a página de administração de quests
2. Tente criar uma quest com um arquivo PDF
3. Abra o console do navegador (F12) e verifique as mensagens de log
4. Se o upload for bem-sucedido, você verá a mensagem "Upload bem-sucedido" seguida pelos detalhes do arquivo

## 5. Estrutura do Armazenamento

Os PDFs são armazenados com a seguinte estrutura:

```
quest-pdfs/
  └── [game_id]/
      └── [quest_id]_[timestamp].pdf
```

Isso garante organização e evita conflitos de nomes de arquivos. 