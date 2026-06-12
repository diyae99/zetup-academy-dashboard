alter table public.group_members enable row level security;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.beneficiary_id = public.current_profile_id()
      and gm.status = 'active'
  );
$$;

create or replace function public.is_group_intervenant(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = target_group_id
      and g.intervenant_id = public.current_profile_id()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_intervenant(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_intervenant(uuid) to authenticated;

drop policy if exists "Admins can read group members" on public.group_members;
drop policy if exists "Beneficiaries can read own memberships" on public.group_members;
drop policy if exists "Intervenants can read assigned group members" on public.group_members;
drop policy if exists "Beneficiaries can read own groups" on public.groups;

create policy "Admins can read group members"
on public.group_members
for select
to authenticated
using (public.is_active_admin());

create policy "Beneficiaries can read own memberships"
on public.group_members
for select
to authenticated
using (beneficiary_id = public.current_profile_id());

create policy "Intervenants can read assigned group members"
on public.group_members
for select
to authenticated
using (public.is_group_intervenant(group_id));

create policy "Beneficiaries can read own groups"
on public.groups
for select
to authenticated
using (public.is_group_member(id));

notify pgrst, 'reload schema';
