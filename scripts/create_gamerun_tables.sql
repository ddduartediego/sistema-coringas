-- Script para criação das tabelas do módulo GameRun Admin no Supabase
-- Este script deve ser executado no Table Editor do Supabase

-- Tabela de Games
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descricao_curta TEXT NOT NULL,
    descricao TEXT NOT NULL,
    quantidade_integrantes INTEGER NOT NULL DEFAULT 1,
    data_inicio TIMESTAMP WITH TIME ZONE,
    imagem_url TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Comentários da tabela games
COMMENT ON TABLE public.games IS 'Tabela para armazenar os jogos/games do sistema';
COMMENT ON COLUMN public.games.id IS 'Identificador único do game';
COMMENT ON COLUMN public.games.titulo IS 'Título do game';
COMMENT ON COLUMN public.games.descricao_curta IS 'Descrição curta do game para exibição nos cards';
COMMENT ON COLUMN public.games.descricao IS 'Descrição completa do game';
COMMENT ON COLUMN public.games.quantidade_integrantes IS 'Quantidade de integrantes permitidos por equipe';
COMMENT ON COLUMN public.games.data_inicio IS 'Data e hora de início do game';
COMMENT ON COLUMN public.games.imagem_url IS 'URL da imagem do game';
COMMENT ON COLUMN public.games.status IS 'Status do game (pendente, ativo, inativo, encerrado)';
COMMENT ON COLUMN public.games.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.games.updated_at IS 'Data e hora da última atualização do registro';

-- Tabela de Equipes do Game
CREATE TABLE IF NOT EXISTS public.game_equipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    lider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Comentários da tabela game_equipes
COMMENT ON TABLE public.game_equipes IS 'Tabela para armazenar as equipes participantes dos games';
COMMENT ON COLUMN public.game_equipes.id IS 'Identificador único da equipe';
COMMENT ON COLUMN public.game_equipes.game_id IS 'Referência ao game que a equipe pertence';
COMMENT ON COLUMN public.game_equipes.nome IS 'Nome da equipe';
COMMENT ON COLUMN public.game_equipes.status IS 'Status da equipe (pendente, ativa, rejeitada)';
COMMENT ON COLUMN public.game_equipes.lider_id IS 'Referência ao profile do líder da equipe';
COMMENT ON COLUMN public.game_equipes.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.game_equipes.updated_at IS 'Data e hora da última atualização do registro';

-- Tabela de Integrantes da Equipe
CREATE TABLE IF NOT EXISTS public.equipe_integrantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipe_id UUID NOT NULL REFERENCES public.game_equipes(id) ON DELETE CASCADE,
    integrante_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(equipe_id, integrante_id)
);

-- Comentários da tabela equipe_integrantes
COMMENT ON TABLE public.equipe_integrantes IS 'Tabela para armazenar os integrantes das equipes';
COMMENT ON COLUMN public.equipe_integrantes.id IS 'Identificador único do relacionamento equipe-integrante';
COMMENT ON COLUMN public.equipe_integrantes.equipe_id IS 'Referência à equipe que o integrante pertence';
COMMENT ON COLUMN public.equipe_integrantes.integrante_id IS 'Referência ao profile do integrante';
COMMENT ON COLUMN public.equipe_integrantes.status IS 'Status do integrante na equipe (pendente, ativo, removido)';
COMMENT ON COLUMN public.equipe_integrantes.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.equipe_integrantes.updated_at IS 'Data e hora da última atualização do registro';

-- Criar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_game_equipes_game_id ON public.game_equipes(game_id);
CREATE INDEX IF NOT EXISTS idx_game_equipes_lider_id ON public.game_equipes(lider_id);
CREATE INDEX IF NOT EXISTS idx_equipe_integrantes_equipe_id ON public.equipe_integrantes(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipe_integrantes_integrante_id ON public.equipe_integrantes(integrante_id);

-- Configurar políticas de segurança RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_integrantes ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela de games

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total aos games" 
ON public.games 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Política para usuários comuns poderem visualizar games ativos
CREATE POLICY "Usuários podem visualizar games ativos" 
ON public.games 
FOR SELECT 
TO authenticated 
USING (status = 'ativo');

-- Políticas para a tabela de equipes

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total às equipes" 
ON public.game_equipes
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Política para líderes gerenciarem suas equipes
CREATE POLICY "Líderes podem gerenciar suas equipes" 
ON public.game_equipes
FOR ALL 
TO authenticated 
USING (lider_id = auth.uid());

-- Política para usuários visualizarem equipes de games ativos
CREATE POLICY "Usuários podem visualizar equipes de games ativos"
ON public.game_equipes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_equipes.game_id
    AND games.status = 'ativo'
  )
);

-- Políticas para a tabela de integrantes da equipe

-- Política para administradores terem acesso total
CREATE POLICY "Administradores têm acesso total aos integrantes das equipes" 
ON public.equipe_integrantes
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.is_admin = true
));

-- Política para líderes gerenciarem os integrantes de suas equipes
CREATE POLICY "Líderes podem gerenciar os integrantes de suas equipes" 
ON public.equipe_integrantes
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.game_equipes
    WHERE game_equipes.id = equipe_integrantes.equipe_id
    AND game_equipes.lider_id = auth.uid()
  )
);

-- Política para usuários visualizarem/gerenciarem sua própria participação
CREATE POLICY "Usuários podem gerenciar sua própria participação" 
ON public.equipe_integrantes
FOR ALL 
TO authenticated 
USING (integrante_id = auth.uid());

-- Criação de função para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar triggers para atualizar o campo updated_at
CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_equipes_updated_at
BEFORE UPDATE ON public.game_equipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipe_integrantes_updated_at
BEFORE UPDATE ON public.equipe_integrantes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 