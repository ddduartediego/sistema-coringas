# Sistema Coringas

Sistema de gestão de integrantes da Equipe Coringas com interface moderna e limpa em tema claro.

## Funcionalidades

- Autenticação com Google
- Aprovação de usuários por administradores
- Gestão de perfis de integrantes
- Administração de parâmetros do sistema (status e funções)
- Interface responsiva

## Requisitos Técnicos

- Node.js 18+ 
- NPM ou Yarn
- Conta no Supabase (https://supabase.com)

## Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/sistema-coringas.git
cd sistema-coringas
```

### 2. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 3. Configurar o Supabase

1. Crie uma conta no [Supabase](https://supabase.com) caso ainda não tenha.
2. Crie um novo projeto no Supabase.
3. No painel do Supabase, vá para SQL Editor e execute o script SQL localizado em `/supabase/schema.sql`.
4. Em configurações do projeto, na seção API, copie a URL e a chave anônima.
5. Crie um arquivo `.env` baseado no `.env.example` e preencha com seus dados:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Configurar autenticação com Google

1. No painel do Supabase, vá para Authentication > Providers.
2. Ative o provedor Google.
3. Configure um projeto no [Google Cloud Console](https://console.cloud.google.com/) para obter Client ID e Client Secret.
4. Adicione o URI de redirecionamento que o Supabase fornece nas configurações do OAuth do Google.
5. Preencha Client ID e Client Secret no Supabase.

### 5. Rodar o projeto em desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O projeto estará disponível em http://localhost:3000

### 6. Build para produção

```bash
npm run build
npm start
# ou
yarn build
yarn start
```

## Usuário Administrador

Por padrão, um usuário administrador é criado com o email `dd.duartediego@gmail.com`. Ao fazer login com essa conta pelo Google, ela será automaticamente vinculada ao perfil de administrador.

## Estrutura de Arquivos

- `/app` - Páginas e rotas da aplicação
- `/components` - Componentes reutilizáveis 
- `/models` - Tipos e interfaces do TypeScript
- `/supabase` - Scripts e configurações do Supabase
- `/utils` - Funções utilitárias

## Tecnologias Utilizadas

- Next.js 14
- React 18
- Supabase (Autenticação e Banco de Dados)
- Tailwind CSS
- Material UI Icons
- React Hook Form + Zod
