-- Adiciona novos campos à tabela 'profiles'
ALTER TABLE "public"."profiles" 
  ADD COLUMN IF NOT EXISTS "rg" TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "naturalidade" TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "nome_mae" TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "nome_pai" TEXT DEFAULT NULL; 