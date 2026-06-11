alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "Admins can read quizzes" on public.quizzes;
drop policy if exists "Intervenants can read assigned quizzes" on public.quizzes;
drop policy if exists "Admins can read quiz attempts" on public.quiz_attempts;
drop policy if exists "Intervenants can read assigned quiz attempts" on public.quiz_attempts;

create policy "Admins can read quizzes"
on public.quizzes
for select
to authenticated
using (public.is_active_admin());

create policy "Intervenants can read assigned quizzes"
on public.quizzes
for select
to authenticated
using (
  created_by = public.current_profile_id()
  or exists (
    select 1
    from public.groups g
    where g.id = quizzes.group_id
      and g.intervenant_id = public.current_profile_id()
  )
);

create policy "Admins can read quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (public.is_active_admin());

create policy "Intervenants can read assigned quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.groups g
    where g.id = quiz_attempts.group_id
      and g.intervenant_id = public.current_profile_id()
  )
);

notify pgrst, 'reload schema';
