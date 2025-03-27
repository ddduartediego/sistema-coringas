-- Adicionar campo número (int) à tabela quests
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "numero" INTEGER;

-- Adicionar campo visível (boolean) à tabela quests, com valor padrão false
ALTER TABLE "quests" ADD COLUMN IF NOT EXISTS "visivel" BOOLEAN DEFAULT false;

-- Adicionar comentários aos novos campos
COMMENT ON COLUMN "quests"."numero" IS 'Número da prova/quest';
COMMENT ON COLUMN "quests"."visivel" IS 'Flag que indica se a quest está visível para as equipes';

-- Atualizar quests existentes para definir um número sequencial
UPDATE "quests" 
SET "numero" = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY created_at) as row_num 
  FROM "quests"
) AS subquery
WHERE "quests".id = subquery.id; 