alter table public.group_members enable row level security;

drop policy if exists "Admins can create group members" on public.group_members;
drop policy if exists "Admins can update group members" on public.group_members;
drop policy if exists "Admins can delete group members" on public.group_members;

create policy "Admins can create group members"
on public.group_members
for insert
to authenticated
with check (public.is_active_admin());

create policy "Admins can update group members"
on public.group_members
for update
to authenticated
using (public.is_active_admin())
with check (public.is_active_admin());

create policy "Admins can delete group members"
on public.group_members
for delete
to authenticated
using (public.is_active_admin());

notify pgrst, 'reload schema';
