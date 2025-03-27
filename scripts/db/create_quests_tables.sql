-- Script para criação das tabelas quests e equipe_quests no Supabase
-- Este script deve ser executado no SQL Editor do Supabase

-- Tabela de Quests (Missões)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    pontos INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativa',
    tipo TEXT NOT NULL DEFAULT 'regular',
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Comentários para a tabela quests
COMMENT ON TABLE public.quests IS 'Tabela para armazenar as missões dos games';
COMMENT ON COLUMN public.quests.id IS 'Identificador único da quest';
COMMENT ON COLUMN public.quests.game_id IS 'Referência ao game que a quest pertence';
COMMENT ON COLUMN public.quests.titulo IS 'Título da quest';
COMMENT ON COLUMN public.quests.descricao IS 'Descrição detalhada da quest';
COMMENT ON COLUMN public.quests.pontos IS 'Quantidade de pontos que a quest vale';
COMMENT ON COLUMN public.quests.status IS 'Status da quest (ativa, inativa)';
COMMENT ON COLUMN public.quests.tipo IS 'Tipo da quest (regular, bônus, desafio)';
COMMENT ON COLUMN public.quests.data_inicio IS 'Data e hora de início da disponibilidade da quest';
COMMENT ON COLUMN public.quests.data_fim IS 'Data e hora de fim da disponibilidade da quest';
COMMENT ON COLUMN public.quests.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.quests.updated_at IS 'Data e hora da última atualização do registro';

-- Tabela de Relação entre Equipes e Quests
CREATE TABLE IF NOT EXISTS public.equipe_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipe_id UUID NOT NULL REFERENCES public.game_equipes(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente',
    resposta TEXT,
    feedback TEXT,
    avaliacao INTEGER,
    avaliado_por UUID REFERENCES public.profiles(id),
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_completada TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(equipe_id, quest_id)
);

-- Comentários para a tabela equipe_quests
COMMENT ON TABLE public.equipe_quests IS 'Tabela para armazenar a relação entre equipes e quests';
COMMENT ON COLUMN public.equipe_quests.id IS 'Identificador único da relação equipe-quest';
COMMENT ON COLUMN public.equipe_quests.equipe_id IS 'Referência à equipe que está realizando a quest';
COMMENT ON COLUMN public.equipe_quests.quest_id IS 'Referência à quest que está sendo realizada';
COMMENT ON COLUMN public.equipe_quests.status IS 'Status da quest para a equipe (pendente, em_andamento, completa, avaliada)';
COMMENT ON COLUMN public.equipe_quests.resposta IS 'Resposta ou entrega da equipe para a quest';
COMMENT ON COLUMN public.equipe_quests.feedback IS 'Feedback do avaliador para a entrega da quest';
COMMENT ON COLUMN public.equipe_quests.avaliacao IS 'Pontuação recebida pela entrega (0-100)';
COMMENT ON COLUMN public.equipe_quests.avaliado_por IS 'Referência ao profile do usuário que avaliou a quest';
COMMENT ON COLUMN public.equipe_quests.data_inicio IS 'Data e hora em que a equipe iniciou a quest';
COMMENT ON COLUMN public.equipe_quests.data_completada IS 'Data e hora em que a equipe completou a quest';
COMMENT ON COLUMN public.equipe_quests.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.equipe_quests.updated_at IS 'Data e hora da última atualização do registro';

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_quests_game_id ON public.quests(game_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON public.quests(status);
CREATE INDEX IF NOT EXISTS idx_equipe_quests_equipe_id ON public.equipe_quests(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipe_quests_quest_id ON public.equipe_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_equipe_quests_status ON public.equipe_quests(status);

-- Habilitar RLS nas tabelas
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_quests ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela quests

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total às quests" 
ON public.quests 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Política para usuários visualizarem quests de games ativos
CREATE POLICY "Usuários podem visualizar quests de games ativos" 
ON public.quests 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = quests.game_id
    AND games.status = 'ativo'
  )
);

-- Políticas para a tabela equipe_quests

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total às equipe_quests" 
ON public.equipe_quests 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Política para integrantes visualizarem quests de suas equipes
CREATE POLICY "Integrantes podem visualizar quests de suas equipes" 
ON public.equipe_quests 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.equipe_integrantes
    WHERE equipe_integrantes.equipe_id = equipe_quests.equipe_id
    AND equipe_integrantes.integrante_id = auth.uid()
    AND equipe_integrantes.status = 'ativo'
  )
);

-- Política para líderes gerenciarem quests de suas equipes
CREATE POLICY "Líderes podem gerenciar quests de suas equipes" 
ON public.equipe_quests 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.game_equipes
    WHERE game_equipes.id = equipe_quests.equipe_id
    AND game_equipes.lider_id = auth.uid()
  )
);

-- Adicionar triggers para atualizar o campo updated_at
CREATE TRIGGER update_quests_updated_at
BEFORE UPDATE ON public.quests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipe_quests_updated_at
BEFORE UPDATE ON public.equipe_quests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 