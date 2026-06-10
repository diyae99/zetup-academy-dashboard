create table if not exists public.intervenants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  full_name text not null,
  email text not null unique,
  phone text,
  languages text[] not null default '{}',
  levels text[] not null default '{}',
  status text not null default 'actif',
  account_status text not null default 'active',
  role text not null default 'intervenant',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intervenants_role_check check (role = 'intervenant'),
  constraint intervenants_account_status_check check (account_status in ('active', 'suspended')),
  constraint intervenants_status_check check (status in ('actif', 'archivé'))
);

create index if not exists intervenants_auth_user_id_idx on public.intervenants(auth_user_id);
create index if not exists intervenants_email_idx on public.intervenants(email);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_intervenants_updated_at on public.intervenants;
create trigger set_intervenants_updated_at
before update on public.intervenants
for each row
execute function public.set_updated_at();

alter table public.intervenants enable row level security;

drop policy if exists "Admins can read intervenants" on public.intervenants;
create policy "Admins can read intervenants"
on public.intervenants
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.account_status = 'active'
  )
);

drop policy if exists "Admins can create intervenants" on public.intervenants;
create policy "Admins can create intervenants"
on public.intervenants
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.account_status = 'active'
  )
);

drop policy if exists "Admins can update intervenants" on public.intervenants;
create policy "Admins can update intervenants"
on public.intervenants
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.account_status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.account_status = 'active'
  )
);

drop policy if exists "Intervenants can read themselves" on public.intervenants;
create policy "Intervenants can read themselves"
on public.intervenants
for select
to authenticated
using (auth_user_id = auth.uid());

grant select, insert, update on public.intervenants to authenticated;

notify pgrst, 'reload schema';
