# Guia de Instalação - Sistema Coringas

Este guia fornecerá instruções detalhadas para instalar e configurar o Sistema Coringas.

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Conta no Google Cloud para configurar a autenticação OAuth

## 1. Instalação do projeto

### Clone o repositório

```bash
git clone https://github.com/seu-usuario/sistema-coringas.git
cd sistema-coringas
```

### Instale as dependências

```bash
npm install
# ou
yarn install
```

## 2. Configuração do Supabase

### 2.1 Crie uma conta no Supabase

Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita caso ainda não tenha.

### 2.2 Crie um novo projeto

1. No dashboard do Supabase, clique em "New Project"
2. Escolha um nome para o projeto (ex: "sistema-coringas")
3. Defina uma senha segura para o banco de dados
4. Selecione a região mais próxima
5. Clique em "Create new project"

### 2.3 Execute o script SQL para criar as tabelas e políticas

1. Após a criação do projeto, vá até "SQL Editor"
2. Copie o conteúdo do arquivo `supabase/schema.sql` do projeto
3. Cole no editor SQL e execute o script

### 2.4 Configure a autenticação com Google

1. Vá para a seção "Authentication" no menu lateral
2. Clique em "Providers"
3. Ative o provedor "Google"

### 2.5 Configura o OAuth no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Vá para "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth client ID"
5. Selecione "Web application" como tipo de aplicação
6. Adicione o URI de redirecionamento que o Supabase fornece nas suas configurações de autenticação Google
   - Deve ser algo como: `https://[SEU-PROJETO].supabase.co/auth/v1/callback`
7. Obtenha o Client ID e Client Secret

### 2.6 Configure o Supabase com as credenciais do Google

1. De volta ao painel do Supabase, em "Authentication" > "Providers" > "Google"
2. Preencha os campos Client ID e Client Secret com os valores obtidos no Google Cloud
3. Salve as configurações

## 3. Configuração do ambiente local

### 3.1 Configure as variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. No painel do Supabase, vá para "Settings" > "API"
3. Copie os valores de "Project URL" e "anon public" para o arquivo `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

## 4. Executando o projeto

### 4.1 Ambiente de desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O sistema estará disponível em `http://localhost:3000`

### 4.2 Build para produção

```bash
npm run build
npm start
# ou
yarn build
yarn start
```

## 5. Primeiro acesso

Após a configuração, você pode entrar no sistema utilizando a conta administradora:

1. Faça login no sistema com o Google usando o email `dd.duartediego@gmail.com`
2. O sistema automaticamente vinculará esse email ao perfil de administrador criado durante a configuração do banco de dados
3. Como administrador, você poderá aprovar novos usuários que se registrarem

## 6. Resolvendo problemas comuns

### Erro de autenticação com Google

- Verifique se o URI de redirecionamento está configurado corretamente no console do Google Cloud
- Confirme se o Client ID e Client Secret foram preenchidos corretamente no Supabase

### Erro ao criar perfil de usuário

- Verifique se o script SQL foi executado corretamente no Supabase
- Confira se as políticas de segurança (RLS) estão configuradas conforme o arquivo schema.sql

### Erro ao acessar como administrador

- Verifique se o email `dd.duartediego@gmail.com` foi corretamente configurado no script SQL
- Confirme que você está usando exatamente o mesmo email no login com Google 