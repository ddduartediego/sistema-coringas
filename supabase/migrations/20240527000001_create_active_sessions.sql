-- Criar tabela para sessões ativas
CREATE TABLE "public"."active_sessions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "last_seen" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "device_info" text,
  PRIMARY KEY ("id"),
  UNIQUE("user_id")
);

-- Criar índice para melhor performance nas consultas
CREATE INDEX active_sessions_user_id_idx ON public.active_sessions(user_id);

-- Função para limpar sessões antigas (mais de 24 horas sem atualização)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_sessions
  WHERE last_seen < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Criar um trigger para executar uma vez por dia (à meia-noite)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_old_sessions();'); 