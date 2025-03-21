-- Criar função para executar SQL
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Executar a consulta SQL dinâmica
  EXECUTE sql_query;
  
  -- Retornar o resultado
  result := jsonb_build_object('status', 'success');
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Capturar e retornar qualquer erro
  result := jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
  
  RETURN result;
END;
$$; 