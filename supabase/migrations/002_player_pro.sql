-- Módulo Player Pro — IPTV (M3U8)
-- Tabelas de usuários clientes, administradores e favoritos.

create table if not exists public.pp_admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  senha_hash text not null,
  role text default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz default now()
);

create table if not exists public.pp_usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text unique not null,
  senha_hash text not null,
  m3u8_url text,
  expiracao date,
  status text check (status in ('ativo', 'bloqueado', 'expirado')) default 'ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pp_favoritos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.pp_usuarios(id) on delete cascade,
  canal_id text not null,
  created_at timestamptz default now(),
  unique (usuario_id, canal_id)
);

-- Admin padrão de demonstração (senha: admin123)
insert into public.pp_admins (email, senha_hash, role)
values ('admin@playerpro.local', 'sha256-salt:95cb5cd77366fcf50d8531989e134dd5788376dfd21a415d502140f9ff95fafa', 'admin')
on conflict (email) do update set senha_hash = excluded.senha_hash;

-- Índices úteis
create index if not exists pp_usuarios_usuario_idx on public.pp_usuarios(usuario);
create index if not exists pp_usuarios_status_idx on public.pp_usuarios(status);
create index if not exists pp_favoritos_usuario_idx on public.pp_favoritos(usuario_id);

-- RLS habilitado: o acesso ocorre exclusivamente pelas server functions
-- com a chave de serviço. Nenhuma política pública é concedida ao browser.
alter table public.pp_admins enable row level security;
alter table public.pp_usuarios enable row level security;
alter table public.pp_favoritos enable row level security;
