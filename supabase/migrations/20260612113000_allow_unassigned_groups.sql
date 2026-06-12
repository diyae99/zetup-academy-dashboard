alter table public.groups
alter column intervenant_id drop not null;

notify pgrst, 'reload schema';
