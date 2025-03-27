# Resolução do Problema de Upload de PDFs

## Problema Identificado

O sistema está apresentando um erro ao tentar fazer upload de arquivos PDF para o Supabase Storage:

```
Error: Erro ao fazer upload do PDF: {}
```

## Causas do Problema

Após análise, identificamos as seguintes causas:

1. **Bucket não configurado corretamente**
   - O bucket "quest-pdfs" foi criado, mas as políticas RLS (Row Level Security) não estão configuradas adequadamente.

2. **Problemas no componente de upload**
   - A função `uploadPdfToStorage` está apresentando erros ao tentar fazer upload do arquivo.
   - A configuração de `onUploadProgress` não é suportada pela versão atual do Supabase.
   - A função não está tratando adequadamente erros e problemas de autenticação.

3. **Inconsistências nos tipos e interfaces**
   - O campo `arquivo_pdf` está corretamente definido na tabela do banco de dados, mas não está presente em todos os lugares necessários na aplicação.
   - A interface `Quest` não inclui o campo `arquivo_pdf` em todos os arquivos.
   - O campo está ausente no estado `formData` do componente de administração de quests.

## Solução Implementada

### 1. Configuração do Bucket no Supabase

Foi criado um script SQL para configurar corretamente as políticas RLS:

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

### 2. Correção na Função de Upload

A função `uploadPdfToStorage` foi reescrita para:

- Verificar se o bucket existe antes de tentar o upload
- Confirmar que o usuário está autenticado
- Simplificar a lógica de upload removendo a opção `onUploadProgress` não suportada
- Usar `upsert: true` para permitir sobrescrever arquivos existentes
- Adicionar retry automático em caso de falha
- Melhorar o tratamento de erros com logs detalhados

### 3. Atualização de Tipos e Interfaces

- O tipo `Database` em `lib/database.types.ts` foi atualizado para incluir o campo `arquivo_pdf`
- A interface `Quest` no componente de administração foi atualizada
- O estado `formData` do componente de administração foi atualizado para incluir o campo `arquivo_pdf`

### 4. Estrutura de Armazenamento

A estrutura do armazenamento foi modificada para:

```
quest-pdfs/
  └── [game_id]/
      └── [quest_id]_[timestamp].pdf
```

## Documentação Criada

1. **Guia Detalhado**: `docs/pdf_upload_config.md` - Instruções detalhadas para configuração do upload de PDFs
2. **Checklist**: `docs/pdf_upload_checklist.md` - Lista de verificação para garantir que todas as etapas sejam seguidas
3. **SQL Scripts**:
   - `scripts/db/alter_quests_add_pdf.sql` - Adiciona o campo `arquivo_pdf` à tabela `quests`
   - `scripts/supabase/storage_policies.sql` - Configura as políticas RLS para o bucket `quest-pdfs`

## Próximos Passos

1. Executar os scripts SQL no Supabase
2. Verificar se o bucket está configurado corretamente
3. Testar a criação de uma quest com upload de PDF
4. Verificar se o PDF pode ser visualizado e baixado na página de detalhes da quest 