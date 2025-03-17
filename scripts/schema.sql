-- Configuração de segurança
create extension if not exists "uuid-ossp";

-- Tabela de configuração de status
create table if not exists public.config_status (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Tabela de configuração de funções
create table if not exists public.config_roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Tabela de perfis de usuários
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  nickname text,
  status text, -- Referência para config_status
  role text, -- Referência para config_roles
  shirt_size text,
  birth_date date,
  cpf text,
  gender text,
  phone text,
  profession text,
  is_admin boolean default false not null,
  is_approved boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id),
  unique(email)
);

-- Função para atualizar o campo updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar automaticamente o campo updated_at
create trigger handle_updated_at_profiles
before update on public.profiles
for each row
execute procedure public.handle_updated_at();

create trigger handle_updated_at_config_status
before update on public.config_status
for each row
execute procedure public.handle_updated_at();

create trigger handle_updated_at_config_roles
before update on public.config_roles
for each row
execute procedure public.handle_updated_at();

-- Inserir valores padrão para config_status
insert into public.config_status (name) values 
  ('Aposentado'),
  ('Veterano'),
  ('Calouro'),
  ('Patrocinador'),
  ('Comercial');

-- Inserir valores padrão para config_roles
insert into public.config_roles (name) values 
  ('Rua'),
  ('QG'),
  ('Liderança');

-- Criar um perfil de administrador padrão
-- Será vinculado ao usuário após o login com Google
insert into public.profiles (
  email, 
  name, 
  is_admin, 
  is_approved
) values (
  'dd.duartediego@gmail.com',
  'Administrador',
  true,
  true
);

-- Configuração de RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.config_status enable row level security;
alter table public.config_roles enable row level security;

-- Políticas de acesso
create policy "Usuários podem ver seus próprios perfis"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios perfis"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Administradores podem ver todos os perfis"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Administradores podem atualizar todos os perfis"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Administradores podem gerenciar status"
  on public.config_status
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Todos podem ver status"
  on public.config_status for select
  using (true);

create policy "Administradores podem gerenciar funções"
  on public.config_roles
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Todos podem ver funções"
  on public.config_roles for select
  using (true);

SELECT * FROM profiles WHERE user_id = '832b9071-a729-4919-8d19-2221635856fa'; 