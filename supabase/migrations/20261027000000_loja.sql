-- Loja da Granola Pura: regiões de entrega, pedidos e histórico de status.
-- O site nunca lê nem grava estas tabelas direto: tudo passa pelas Edge
-- Functions (service role). A única leitura com login é a do painel da Lynda.

create table public.regioes_entrega (
  id          bigint generated always as identity primary key,
  nome        text not null,
  cep_inicio  integer not null check (cep_inicio between 0 and 99999999),
  cep_fim     integer not null check (cep_fim between 0 and 99999999),
  frete_centavos integer not null check (frete_centavos >= 0),
  prazo       text not null,
  ativo       boolean not null default true,
  check (cep_inicio <= cep_fim)
);

comment on table public.regioes_entrega is
  'Faixas de CEP atendidas. Se um CEP cair em mais de uma faixa, vale a mais estreita.';

create type public.status_pedido as enum (
  'aguardando_pagamento',
  'pago',
  'saiu_para_entrega',
  'entregue',
  'cancelado'
);

create table public.pedidos (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  status          public.status_pedido not null default 'aguardando_pagamento',
  criado_em       timestamptz not null default now(),
  pago_em         timestamptz,

  quantidade      integer not null check (quantidade between 1 and 20),
  preco_centavos  integer not null,
  frete_centavos  integer not null,
  total_centavos  integer not null,
  regiao          text not null,
  prazo           text not null,

  nome            text not null,
  email           text not null,
  telefone        text not null,
  cep             text not null,
  logradouro      text not null,
  numero          text not null,
  complemento     text,
  bairro          text not null,
  cidade          text not null,
  uf              text not null,
  observacoes     text,

  mp_preferencia_id text,
  mp_pagamento_id   text,
  check (total_centavos = quantidade * preco_centavos + frete_centavos)
);

create index pedidos_status_idx on public.pedidos (status, criado_em desc);

create table public.eventos_pedido (
  id         bigint generated always as identity primary key,
  pedido_id  uuid not null references public.pedidos (id) on delete cascade,
  status     public.status_pedido not null,
  detalhe    text,
  criado_em  timestamptz not null default now()
);

create index eventos_pedido_pedido_idx on public.eventos_pedido (pedido_id, criado_em);

-- Quem pode entrar no painel. Cadastre o e-mail da Lynda aqui.
create table public.admins (
  email text primary key check (email = lower(email))
);

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.eh_admin() from public, anon;
grant execute on function public.eh_admin() to authenticated;

alter table public.regioes_entrega enable row level security;
alter table public.pedidos        enable row level security;
alter table public.eventos_pedido enable row level security;
alter table public.admins         enable row level security;

-- Sem policies para anon: o público não acessa nenhuma tabela.
create policy "admin lê pedidos" on public.pedidos
  for select to authenticated using (public.eh_admin());

create policy "admin lê eventos" on public.eventos_pedido
  for select to authenticated using (public.eh_admin());

create policy "admin lê regiões" on public.regioes_entrega
  for select to authenticated using (public.eh_admin());

-- Tabela provisória (SP e região) até a Lynda confirmar regiões, preços e prazos.
-- A capital fica numa faixa mais estreita, então ganha da faixa da Grande SP.
insert into public.regioes_entrega (nome, cep_inicio, cep_fim, frete_centavos, prazo) values
  ('São Paulo (capital)', 1000000, 5999999, 1500, 'até 2 dias úteis'),
  ('São Paulo (capital)', 8000000, 8499999, 1500, 'até 2 dias úteis'),
  ('Grande São Paulo',    6000000, 9999999, 2000, 'até 3 dias úteis');
