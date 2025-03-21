import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Criando um cliente Supabase com privilégios de administrador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validar que as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro nas variáveis de ambiente:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definido' : 'VAZIO');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definido' : 'VAZIO');
}

const supabaseAdmin = createClient(
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
    console.log('Iniciando upload via API serverless...');
    console.log('Variáveis de ambiente:');
    console.log('- URL do Supabase definida:', !!supabaseUrl);
    console.log('- Chave de serviço definida:', !!supabaseServiceKey);

    // Obter o arquivo enviado
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    console.log('Arquivo recebido:', file.name, 'Tipo:', file.type, 'Tamanho:', file.size);

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'O arquivo enviado não é uma imagem válida' },
        { status: 400 }
      );
    }

    // Verificar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 2MB' },
        { status: 400 }
      );
    }

    // Criar nome de arquivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `gamerun/${fileName}`;

    console.log('Nome do arquivo gerado:', fileName);
    console.log('Caminho no storage:', filePath);

    // Converter o arquivo para um buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log('Arquivo convertido para buffer. Tamanho:', buffer.length);

    // Verificar/criar bucket
    console.log('Verificando se o bucket "images" existe...');
    let { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError);
      return NextResponse.json(
        { error: `Erro ao listar buckets: ${bucketsError.message}` },
        { status: 500 }
      );
    }
    
    const imagesBucket = buckets?.find(bucket => bucket.name === 'images');
    console.log('Bucket "images" encontrado?', !!imagesBucket);
    
    if (!imagesBucket) {
      console.log('Tentando criar bucket "images"...');
      // Criar bucket se não existir
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('images', {
        public: true, // Acesso público aos arquivos
        fileSizeLimit: 2097152, // 2MB
      });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return NextResponse.json(
          { error: `Erro ao criar bucket: ${createError.message}` },
          { status: 500 }
        );
      }
      
      console.log('Bucket criado com sucesso:', newBucket);
      console.log('IMPORTANTE: Para o upload funcionar corretamente, acesse o console do Supabase:');
      console.log('1. Vá para Storage > Buckets > images');
      console.log('2. Clique em "Policies"');
      console.log('3. Adicione uma política pública que permita SELECT para todos (condition: TRUE)');
      console.log('4. Adicione uma política que permita INSERT para autenticados (auth.role() = \'authenticated\')');
    }

    // Upload do arquivo usando o cliente admin (bypass RLS)
    console.log('Iniciando upload do arquivo para o Supabase...');
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Erro detalhado ao fazer upload:', JSON.stringify(error));
      
      return NextResponse.json(
        { 
          error: `Erro ao fazer upload: ${error.message}`,
          details: JSON.stringify(error)
        },
        { status: 500 }
      );
    }

    console.log('Upload concluído com sucesso:', data);

    // Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log('URL pública obtida:', urlData.publicUrl);

    return NextResponse.json({ 
      url: urlData.publicUrl,
      path: filePath,
      success: true
    });
  } catch (error: any) {
    console.error('Erro na API de upload:', error);
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