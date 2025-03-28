import { NextResponse } from 'next/server';

/**
 * API para obter a data e hora atuais do servidor
 * GET /api/date
 */
export async function GET() {
  try {
    // Obtém a data e hora atual do servidor
    const now = new Date();
    
    // Retorna a data em formato ISO 8601 e também timestamp em milissegundos para facilitar comparações
    return NextResponse.json({
      datetime: now.toISOString(),
      timestamp: now.getTime(),
      formatted: {
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR'),
        full: now.toLocaleString('pt-BR')
      }
    });
  } catch (error: any) {
    console.error('Erro ao processar a requisição de data:', error);
    return NextResponse.json(
      { error: `Erro no servidor: ${error.message}` }, 
      { status: 500 }
    );
  }
} 