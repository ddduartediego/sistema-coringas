import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { scriptName, adminKey } = requestData;
    
    // Verificar a autorização (adicione sua própria lógica de segurança aqui)
    if (!adminKey || adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o nome do script foi fornecido
    if (!scriptName) {
      return NextResponse.json(
        { error: 'Nome do script não fornecido' },
        { status: 400 }
      );
    }
    
    // Ler o conteúdo do script
    const scriptPath = path.join(process.cwd(), 'scripts', 'db', `${scriptName}.sql`);
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: `Script não encontrado: ${scriptName}` },
        { status: 404 }
      );
    }
    
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Executar o script no Supabase
    const supabase = createRouteHandlerClient<any>({ cookies });
    
    // Usar a API rpc para executar SQL personalizado
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: scriptContent
    });
    
    if (error) {
      console.error('Erro ao executar script:', error);
      return NextResponse.json(
        { error: `Erro ao executar script: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Script ${scriptName} executado com sucesso`,
      data
    });
    
  } catch (error: any) {
    console.error('Erro na migração:', error);
    return NextResponse.json(
      { error: `Erro na migração: ${error.message}` },
      { status: 500 }
    );
  }
} 