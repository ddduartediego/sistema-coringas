# Checklist de Configuração para Upload de PDFs

## 1. Banco de Dados

- [ ] Executar o script `scripts/db/alter_quests_add_pdf.sql` no Supabase SQL Editor
```sql
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "arquivo_pdf" TEXT;
COMMENT ON COLUMN "quests"."arquivo_pdf" IS 'URL ou caminho para o arquivo PDF da quest';
```

## 2. Supabase Storage

- [ ] Criar bucket "quest-pdfs" no Supabase Storage
- [ ] Marcar o bucket como público
- [ ] Configurar políticas RLS executando o script `scripts/supabase/storage_policies.sql`:
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

## 3. Código da Aplicação

- [ ] O campo `arquivo_pdf` foi adicionado à interface `Quest` em todos os arquivos relevantes
- [ ] O tipo `Database` em `lib/database.types.ts` foi atualizado para incluir o campo `arquivo_pdf` na tabela `quests`
- [ ] A função `uploadPdfToStorage` no cliente de administração de quests está funcionando corretamente
- [ ] A função de apresentação do PDF na página de detalhes da quest está exibindo corretamente o link para o arquivo

## 4. Testes

- [ ] Verificar se o usuário está autenticado antes de tentar fazer upload (abrir console e executar `await supabase.auth.getSession()`)
- [ ] Teste de upload de PDF funciona corretamente
- [ ] A URL do PDF está sendo salva no banco de dados
- [ ] O PDF pode ser visualizado na página de detalhes da quest
- [ ] O PDF pode ser baixado da página de detalhes da quest

## 5. Solução de Problemas

Se o upload de PDF continuar falhando após todas as verificações:

1. Verifique se há erros no console do navegador
2. Confirme se o token de autenticação está presente e válido
3. Verifique se o bucket "quest-pdfs" existe e está configurado corretamente 
4. Valide se as políticas RLS estão aplicadas conforme esperado
5. Tente fazer upload de um arquivo menor (menos de 5MB)
6. Verifique se o MIME type do arquivo é realmente "application/pdf" 