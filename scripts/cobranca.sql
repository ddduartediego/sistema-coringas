-- Script para criar as tabelas do módulo de Gestão de Cobranças
-- Executar este script no banco de dados para configurar o módulo

-- Tabela de métodos de pagamento
CREATE TABLE IF NOT EXISTS config_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir alguns métodos de pagamento padrão
INSERT INTO config_payment_methods (name, description) 
VALUES 
  ('Pix', 'Pagamento via Pix'),
  ('Transferência Bancária', 'Transferência entre contas'),
  ('Dinheiro', 'Pagamento em espécie'),
  ('Cartão de Crédito', 'Pagamento com cartão de crédito');

-- Tabela principal de cobranças
CREATE TABLE IF NOT EXISTS cobrancas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  mes_vencimento INTEGER NOT NULL,
  ano_vencimento INTEGER NOT NULL,
  is_parcelado BOOLEAN DEFAULT FALSE,
  parcelas INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar triggers para atualização automática de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cobrancas_updated_at
BEFORE UPDATE ON cobrancas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de parcelas
CREATE TABLE IF NOT EXISTS cobranca_parcelas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cobranca_id UUID NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  mes_vencimento INTEGER NOT NULL,
  ano_vencimento INTEGER NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação entre cobranças e integrantes
CREATE TABLE IF NOT EXISTS cobranca_integrantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cobranca_id UUID NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
  integrante_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Pago', 'Atrasado')),
  forma_pagamento_id UUID REFERENCES config_payment_methods(id),
  data_pagamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cobranca_id, integrante_id)
);

-- Trigger para atualização de updated_at em cobranca_integrantes
CREATE TRIGGER update_cobranca_integrantes_updated_at
BEFORE UPDATE ON cobranca_integrantes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar o desempenho
CREATE INDEX idx_cobranca_parcelas_cobranca_id ON cobranca_parcelas(cobranca_id);
CREATE INDEX idx_cobranca_integrantes_cobranca_id ON cobranca_integrantes(cobranca_id);
CREATE INDEX idx_cobranca_integrantes_integrante_id ON cobranca_integrantes(integrante_id);
CREATE INDEX idx_cobranca_integrantes_status ON cobranca_integrantes(status);


-- Habilitar auditoria básica
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para auditar mudanças em cobranca_integrantes
CREATE OR REPLACE FUNCTION audit_cobranca_integrantes_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audits (table_name, record_id, operation, old_values, new_values, changed_by)
    VALUES ('cobranca_integrantes', OLD.id, TG_OP, 
            to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audits (table_name, record_id, operation, new_values, changed_by)
    VALUES ('cobranca_integrantes', NEW.id, TG_OP, 
            to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audits (table_name, record_id, operation, old_values, changed_by)
    VALUES ('cobranca_integrantes', OLD.id, TG_OP, 
            to_jsonb(OLD), auth.uid());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para auditoria
CREATE TRIGGER audit_cobranca_integrantes_changes
AFTER INSERT OR UPDATE OR DELETE ON cobranca_integrantes
FOR EACH ROW
EXECUTE FUNCTION audit_cobranca_integrantes_changes();

-- Comentários nas tabelas para documentação
COMMENT ON TABLE cobrancas IS 'Armazena as cobranças do sistema';
COMMENT ON TABLE cobranca_parcelas IS 'Armazena as parcelas de cobranças parceladas';
COMMENT ON TABLE cobranca_integrantes IS 'Relaciona cobranças com integrantes e armazena o status de pagamento';
COMMENT ON TABLE config_payment_methods IS 'Métodos de pagamento disponíveis no sistema'; 