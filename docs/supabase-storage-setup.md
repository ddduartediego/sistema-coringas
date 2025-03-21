# Configuração do Supabase Storage para Upload de Imagens

Este documento explica como configurar corretamente o Supabase Storage para permitir o upload de imagens no módulo GameRun Admin.

## Nova abordagem: API serverless para upload

A partir desta versão, implementamos uma abordagem mais segura e confiável para o upload de imagens, utilizando uma API serverless que funciona como intermediária. Esta abordagem contorna as restrições de políticas de segurança (RLS) do Supabase Storage.

### Como funciona

1. O componente de upload envia a imagem para a API `/api/upload`
2. A API utiliza um cliente Supabase com privilégios administrativos (service role key)
3. O upload é realizado com sucesso e a URL pública é retornada para o frontend

### Configuração da API de upload

Para configurar corretamente esta API, você precisa:

1. Obter a **Service Role Key** do seu projeto Supabase:
   - Acesse o [Console do Supabase](https://app.supabase.io)
   - Selecione seu projeto
   - Navegue até "Project Settings" > "API"
   - Role a página até encontrar "Project API keys"
   - Copie a chave "service_role" (é a chave secreta, não compartilhe!)

2. Configure a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` no arquivo `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

3. Reinicie o servidor de desenvolvimento

## Abordagem anterior: Políticas de acesso

> **Nota**: Esta seção é mantida para referência, mas não é mais necessária para o funcionamento do upload de imagens.

Para que o upload e visualização de imagens funcionem corretamente usando o cliente Supabase diretamente, você precisa configurar as políticas de acesso:

### 1. Criar o Bucket 'images'

Você pode criar manualmente o bucket ou permitir que a aplicação o crie automaticamente na primeira utilização.

**Para criar manualmente:**

1. Acesse o [Console do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Navegue até "Storage" no menu lateral
4. Clique em "Create New Bucket"
5. Nome do bucket: `images`
6. Marque a opção "Public bucket" para permitir acesso público às imagens
7. Clique em "Create bucket"

### 2. Configurar as Políticas de Acesso

#### Política para Upload (INSERT)

1. Na seção Storage, selecione o bucket `images`
2. Vá para a aba "Policies"
3. Clique em "Add Policy"
4. Selecione "Custom Policy"
5. Preencha os campos:
   - Policy name: `Upload de imagens`
   - Allowed operations: `INSERT`
   - Policy definition: 
     ```sql
     ((bucket_id = 'images'::text) AND (auth.role() = 'authenticated'::text))
     ```
   - Este exemplo permite que apenas usuários autenticados façam upload

#### Política para Leitura (SELECT)

1. Ainda na aba "Policies", clique em "Add Policy" novamente
2. Selecione "Custom Policy"
3. Preencha os campos:
   - Policy name: `Leitura pública de imagens`
   - Allowed operations: `SELECT`
   - Policy definition: 
     ```sql
     (bucket_id = 'images'::text)
     ```
   - Este exemplo permite que qualquer pessoa visualize as imagens

## Solução de Problemas

### Erro "Permission denied" ou "violates row-level security policy"

Este erro geralmente ocorre quando:

1. As políticas de acesso não estão configuradas corretamente
2. O usuário não tem permissão para fazer uploads no bucket
3. A variável `SUPABASE_SERVICE_ROLE_KEY` não está configurada corretamente

Para resolver, verifique:

1. Se a variável `SUPABASE_SERVICE_ROLE_KEY` está configurada corretamente no `.env.local`
2. Se o bucket "images" existe no Supabase Storage
3. Se a API `/api/upload` está funcionando corretamente (verifique os logs do servidor)

## Referências

- [Documentação do Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas de Acesso do Supabase](https://supabase.com/docs/guides/storage/security)
- [Autenticação do Supabase](https://supabase.com/docs/guides/auth) 