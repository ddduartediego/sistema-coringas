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
    // Usar o cliente tipado como any para lidar com RPCs não definidas no tipo Database
    const supabaseAny = supabase as any;

    let result;
    
    try {
      // Tenta primeiro usar a função execute_sql
      console.log('Tentando executar migração via função execute_sql');
      const { data, error } = await supabaseAny.rpc('execute_sql', { sql_query: scriptContent });
      
      if (error) {
        throw error;
      }
      
      result = data || { status: 'success', message: 'Migração executada com sucesso via função execute_sql' };
    } catch (error: any) {
      console.log('Função execute_sql falhou, tentando método alternativo:', error.message);
      
      // Se a função falhar, tente executar o SQL diretamente via execute_raw_sql
      // Dividir o script em comandos separados
      const sqlCommands = scriptContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
      
      // Executar cada comando separadamente
      for (const cmd of sqlCommands) {
        try {
          const { error } = await supabaseAny.rpc('execute_raw_sql', { sql: cmd + ';' });
          
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
        } catch (cmdError: any) {
          console.error('Erro ao executar comando SQL:', cmdError);
          return NextResponse.json(
            { 
              error: `Falha ao executar comando SQL: ${cmdError.message}`,
              details: cmdError 
            },
            { status: 500 }
          );
        }
      }
      
      result = { status: 'success', message: 'Migração executada com sucesso (método direto)' };
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