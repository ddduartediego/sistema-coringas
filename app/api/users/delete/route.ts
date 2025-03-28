import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/models/database.types';

// Criando um cliente Supabase com privilégios de administrador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validar que as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro nas variáveis de ambiente para API de exclusão de usuários:');
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

export async function POST(request: NextRequest) {
  try {
    console.log('API de exclusão de usuário iniciada');
    
    // Extrair o auth_id do corpo da requisição
    const { auth_id } = await request.json();
    
    if (!auth_id) {
      console.error('ID de autenticação não fornecido na requisição');
      return NextResponse.json(
        { error: 'ID de autenticação do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('Tentando excluir usuário com ID de autenticação:', auth_id);
    
    // Excluir o usuário
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(
      auth_id
    );
    
    if (error) {
      console.error('Erro ao excluir usuário:', error);
      return NextResponse.json(
        { error: `Erro ao excluir usuário: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('Usuário excluído com sucesso:', data);
    
    return NextResponse.json({ 
      success: true,
      message: 'Usuário excluído com sucesso'
    });
    
  } catch (error: any) {
    console.error('Erro na API de exclusão de usuário:', error);
    return NextResponse.json(
      { 
        error: `Erro no servidor: ${error.message}`,
        details: error.stack
      },
      { status: 500 }
    );
  }
} 