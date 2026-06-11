alter table public.groups enable row level security;
alter table public.languages enable row level security;
alter table public.levels enable row level security;

drop policy if exists "Admins can manage groups" on public.groups;
drop policy if exists "Intervenants can read assigned groups" on public.groups;
drop policy if exists "Authenticated users can read languages" on public.languages;
drop policy if exists "Authenticated users can read levels" on public.levels;

create policy "Admins can manage groups"
on public.groups
for all
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

create policy "Intervenants can read assigned groups"
on public.groups
for select
to authenticated
using (
  exists (
    select 1
    from public.intervenants i
    where i.id = groups.intervenant_id
      and i.auth_user_id = auth.uid()
      and i.role = 'intervenant'
      and i.account_status = 'active'
  )
);

create policy "Authenticated users can read languages"
on public.languages
for select
to authenticated
using (true);

create policy "Authenticated users can read levels"
on public.levels
for select
to authenticated
using (true);

notify pgrst, 'reload schema';
