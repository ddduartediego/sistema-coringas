import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    const { scriptName, adminKey } = await request.json();
    
    if (!scriptName) {
      return NextResponse.json(
        { error: 'O nome do script é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar a chave de administração
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (adminKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Chave de administração inválida' },
        { status: 403 }
      );
    }

    // Localizar o script
    const scriptPath = path.join(process.cwd(), 'scripts', 'db', `${scriptName}.sql`);
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: `Script '${scriptName}' não encontrado` },
        { status: 404 }
      );
    }

    // Ler o conteúdo do script
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

    // Executar o script
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Verificar se a função execute_sql existe
    const { data: functionExists, error: functionCheckError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'execute_sql')
      .limit(1);

    let result;
    
    if (functionCheckError || !functionExists || functionExists.length === 0) {
      console.log('Função execute_sql não encontrada, executando SQL diretamente.');
      
      // Se a função não existir, executar o SQL diretamente via API RPC
      // Essa é uma abordagem alternativa que funciona para algumas operações,
      // mas pode ser limitada dependendo dos privilégios do cliente
      
      // Dividir o script em comandos separados
      const sqlCommands = scriptContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
      
      // Executar cada comando separadamente
      for (const cmd of sqlCommands) {
        const { error } = await supabase.rpc('execute_raw_sql', { sql: cmd + ';' });
        
        if (error) {
          console.error('Erro ao executar SQL direto:', error);
          return NextResponse.json(
            { 
              error: `Falha ao executar migração direta: ${error.message}`,
              details: error 
            },
            { status: 500 }
          );
        }
      }
      
      result = { status: 'success', message: 'Migração executada com sucesso (método direto)' };
    } else {
      // Se a função existir, usar para executar o script
      console.log('Executando migração via função execute_sql');
      const { data, error } = await supabase.rpc('execute_sql', { sql_query: scriptContent });
      
      if (error) {
        console.error('Erro ao executar SQL via função:', error);
        return NextResponse.json(
          { 
            error: `Falha ao executar migração: ${error.message}`, 
            details: error 
          },
          { status: 500 }
        );
      }
      
      result = data || { status: 'success', message: 'Migração executada com sucesso' };
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('Erro ao processar a migração:', error);
    return NextResponse.json(
      { 
        error: `Erro interno: ${error.message}`,
        details: error
      },
      { status: 500 }
    );
  }
} 