# Configuração do Storage para o GameRun

Este documento explica como configurar o Storage no Supabase para permitir o upload de imagens para o módulo GameRun.

## Criação do Bucket

1. Acesse o dashboard do Supabase e selecione seu projeto.
2. No menu lateral, clique em "Storage".
3. Clique em "Create a new bucket".
4. Nome do bucket: `images`
5. Selecione a opção "Public bucket" para permitir acesso público às imagens.
6. Clique em "Create bucket".

## Configuração de Segurança (RLS)

Após criar o bucket, precisamos configurar as políticas de segurança (Row Level Security) para permitir que usuários autenticados façam upload de imagens, mas somente administradores possam deletar imagens.

1. Na página do bucket recém-criado, clique na aba "Policies".
2. Clique em "Add policies" e crie as seguintes políticas:

### Política para INSERT (Upload)

```sql
CREATE POLICY "Allow all authenticated users to upload images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gamerun'
);
```

### Política para SELECT (Visualização)

```sql
CREATE POLICY "Allow public access to images" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'images');
```

### Política para UPDATE (Atualização)

```sql
CREATE POLICY "Allow admins to update images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gamerun' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.app_metadata->>'role' = 'admin'
  )
);
```

### Política para DELETE (Remoção)

```sql
CREATE POLICY "Allow admins to delete images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'gamerun' AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.app_metadata->>'role' = 'admin'
  )
);
```

## Estrutura de Pastas

Para manter as imagens organizadas, estamos usando a seguinte estrutura:

```
images/ (bucket)
  ├── gamerun/ (pasta para imagens de games)
  │   ├── [uuid].jpg
  │   ├── [uuid].png
  │   └── ...
  └── ...
```

## Verificação

Para verificar se a configuração está correta:

1. Tente fazer upload de uma imagem pelo módulo GameRun Admin
2. Verifique se a imagem está acessível publicamente
3. Confirme que a URL da imagem começa com o padrão: `https://[PROJECT_ID].supabase.co/storage/v1/object/public/images/gamerun/...`

## Solução de Problemas

Se encontrar problemas com o upload de imagens:

1. Verifique os logs do console do navegador para erros
2. Confirme se o usuário tem a role 'admin' na tabela auth.users
3. Verifique se o bucket 'images' existe e está configurado como público
4. Revise as políticas RLS para garantir que estão configuradas corretamente 