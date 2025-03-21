-- Adicionar coluna tipo à tabela games
ALTER TABLE games ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Online';

-- Atualizar todos os registros existentes para ter um valor padrão
UPDATE games SET tipo = 'Online' WHERE tipo IS NULL;

-- Criar tabela de configurações para tipos de games (se ainda não existir)
CREATE TABLE IF NOT EXISTS configuracoes_game (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar restrição única à coluna tipo
ALTER TABLE configuracoes_game ADD CONSTRAINT configuracoes_game_tipo_key UNIQUE (tipo);

-- Inserir valores padrão para tipos
INSERT INTO configuracoes_game (tipo, descricao, ativo)
VALUES 
    ('Online', 'Game totalmente online', TRUE),
    ('Presencial', 'Game presencial', TRUE),
    ('Híbrido', 'Game com atividades online e presenciais', TRUE)
ON CONFLICT (tipo) DO NOTHING;

-- Comentários para as colunas
COMMENT ON COLUMN games.tipo IS 'Tipo do game: Online, Presencial, etc';
COMMENT ON TABLE configuracoes_game IS 'Tabela para armazenar configurações relacionadas a games'; 