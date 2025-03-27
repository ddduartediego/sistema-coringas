-- Adicionar campo arquivo_pdf (TEXT) à tabela quests
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "arquivo_pdf" TEXT;

-- Adicionar comentário ao novo campo
COMMENT ON COLUMN "quests"."arquivo_pdf" IS 'URL ou caminho para o arquivo PDF da quest'; 