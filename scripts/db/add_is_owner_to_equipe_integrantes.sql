-- Script para adicionar a coluna is_owner na tabela equipe_integrantes

-- Adicionando a coluna is_owner (boolean) com valor padrão false
ALTER TABLE public.equipe_integrantes 
ADD COLUMN is_owner BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentário explicativo na coluna
COMMENT ON COLUMN public.equipe_integrantes.is_owner IS 'Indica se o integrante é proprietário/líder da equipe';

-- Criar um índice para melhorar a performance em consultas que filtram por is_owner
CREATE INDEX IF NOT EXISTS idx_equipe_integrantes_is_owner ON public.equipe_integrantes(is_owner);

-- Atualizar os registros existentes com base na tabela game_equipes
-- Define is_owner como true para integrantes que são líderes da equipe
UPDATE public.equipe_integrantes ei
SET is_owner = true
FROM public.game_equipes ge
WHERE ei.equipe_id = ge.id
AND ei.integrante_id = ge.lider_id;

-- Confirmar que a migração foi concluída
SELECT 'Coluna is_owner adicionada com sucesso à tabela equipe_integrantes' as result; 