import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

// Criando um cliente Supabase com privilégios de administrador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validar que as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro nas variáveis de ambiente para API de games:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definido' : 'VAZIO');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definido' : 'VAZIO');
}

const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Rota para criar ou atualizar um jogo
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando API de games (criação/atualização)...');
    
    // Verificar autenticação básica
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter o corpo da requisição
    const body = await request.json();
    const { gameId, gameData } = body;

    if (!gameData) {
      return NextResponse.json(
        { error: 'Dados do jogo não fornecidos' },
        { status: 400 }
      );
    }

    console.log('Dados recebidos:', gameId ? 'Atualizar jogo' : 'Criar novo jogo');
    
    const agora = new Date().toISOString();
    
    if (gameId) {
      // Atualizar jogo existente
      console.log('Atualizando jogo com ID:', gameId);
      
      const { data, error } = await supabaseAdmin
        .from('games')
        .update({
          ...gameData,
          updated_at: agora
        })
        .eq('id', gameId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar jogo:', error);
        return NextResponse.json(
          { error: `Erro ao atualizar jogo: ${error.message}` },
          { status: 500 }
        );
      }
      
      console.log('Jogo atualizado com sucesso');
      return NextResponse.json({ 
        success: true, 
        message: 'Jogo atualizado com sucesso',
        game: data
      });
      
    } else {
      // Criar novo jogo
      console.log('Criando novo jogo');
      
      const { data, error } = await supabaseAdmin
        .from('games')
        .insert({
          ...gameData,
          status: 'pendente',
          created_at: agora,
          updated_at: agora
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar jogo:', error);
        return NextResponse.json(
          { error: `Erro ao criar jogo: ${error.message}` },
          { status: 500 }
        );
      }
      
      console.log('Jogo criado com sucesso');
      return NextResponse.json({ 
        success: true, 
        message: 'Jogo criado com sucesso',
        game: data
      });
    }
    
  } catch (error: any) {
    console.error('Erro na API de games:', error);
    return NextResponse.json(
      { 
        error: `Erro no servidor: ${error.message}`,
        stack: error.stack,
        details: JSON.stringify(error)
      },
      { status: 500 }
    );
  }
}

// Rota para ativar um jogo
export async function PATCH(request: NextRequest) {
  try {
    console.log('Iniciando API de games (ativar jogo)...');
    
    // Verificar autenticação básica
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter o corpo da requisição
    const body = await request.json();
    const { gameId, action } = body;

    if (!gameId || !action) {
      return NextResponse.json(
        { error: 'ID do jogo e ação são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`Executando ação '${action}' no jogo ID: ${gameId}`);
    
    if (action === 'activate') {
      // Ativar jogo
      const { data, error } = await supabaseAdmin
        .from('games')
        .update({ 
          status: 'ativo',
          updated_at: new Date().toISOString() 
        })
        .eq('id', gameId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao ativar jogo:', error);
        return NextResponse.json(
          { error: `Erro ao ativar jogo: ${error.message}` },
          { status: 500 }
        );
      }
      
      console.log('Jogo ativado com sucesso');
      return NextResponse.json({ 
        success: true, 
        message: 'Jogo ativado com sucesso',
        game: data
      });
    }
    
    // Ação não reconhecida
    return NextResponse.json(
      { error: `Ação não reconhecida: ${action}` },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Erro na API de games:', error);
    return NextResponse.json(
      { 
        error: `Erro no servidor: ${error.message}`,
        stack: error.stack,
        details: JSON.stringify(error)
      },
      { status: 500 }
    );
  }
} 