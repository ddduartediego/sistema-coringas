-- Configuração de políticas para o bucket quest-pdfs

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