drop policy if exists "Intervenants can read assigned groups" on public.groups;

create policy "Intervenants can read assigned groups"
on public.groups
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = groups.intervenant_id
      and p.auth_user_id = auth.uid()
      and p.role = 'intervenant'
      and p.account_status = 'active'
  )
);

notify pgrst, 'reload schema';
