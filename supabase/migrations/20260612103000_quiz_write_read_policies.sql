alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

create or replace function public.can_access_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    left join public.groups g on g.id = q.group_id
    where q.id = target_quiz_id
      and (
        public.is_active_admin()
        or q.created_by = public.current_profile_id()
        or g.intervenant_id = public.current_profile_id()
        or public.is_group_member(q.group_id)
      )
  );
$$;

create or replace function public.can_manage_quiz(target_quiz_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = target_quiz_id
      and (
        public.is_active_admin()
        or q.created_by = public.current_profile_id()
      )
  );
$$;

revoke all on function public.can_access_quiz(uuid) from public;
revoke all on function public.can_manage_quiz(uuid) from public;
grant execute on function public.can_access_quiz(uuid) to authenticated;
grant execute on function public.can_manage_quiz(uuid) to authenticated;

drop policy if exists "Intervenants can create assigned quizzes" on public.quizzes;
drop policy if exists "Intervenants can update own quizzes" on public.quizzes;
drop policy if exists "Intervenants can delete own quizzes" on public.quizzes;
drop policy if exists "Authenticated users can read quiz questions" on public.quiz_questions;
drop policy if exists "Intervenants can create quiz questions" on public.quiz_questions;
drop policy if exists "Intervenants can update quiz questions" on public.quiz_questions;
drop policy if exists "Intervenants can delete quiz questions" on public.quiz_questions;
drop policy if exists "Authenticated users can read quiz options" on public.quiz_options;
drop policy if exists "Intervenants can create quiz options" on public.quiz_options;
drop policy if exists "Intervenants can update quiz options" on public.quiz_options;
drop policy if exists "Intervenants can delete quiz options" on public.quiz_options;
drop policy if exists "Beneficiaries can create own quiz attempts" on public.quiz_attempts;
drop policy if exists "Beneficiaries can create own quiz answers" on public.quiz_answers;
drop policy if exists "Authenticated users can read accessible quiz answers" on public.quiz_answers;

create policy "Intervenants can create assigned quizzes"
on public.quizzes
for insert
to authenticated
with check (
  created_by = public.current_profile_id()
  and public.is_group_intervenant(group_id)
);

create policy "Intervenants can update own quizzes"
on public.quizzes
for update
to authenticated
using (created_by = public.current_profile_id() or public.is_active_admin())
with check (created_by = public.current_profile_id() or public.is_active_admin());

create policy "Intervenants can delete own quizzes"
on public.quizzes
for delete
to authenticated
using (created_by = public.current_profile_id() or public.is_active_admin());

create policy "Authenticated users can read quiz questions"
on public.quiz_questions
for select
to authenticated
using (public.can_access_quiz(quiz_id));

create policy "Intervenants can create quiz questions"
on public.quiz_questions
for insert
to authenticated
with check (public.can_manage_quiz(quiz_id));

create policy "Intervenants can update quiz questions"
on public.quiz_questions
for update
to authenticated
using (public.can_manage_quiz(quiz_id))
with check (public.can_manage_quiz(quiz_id));

create policy "Intervenants can delete quiz questions"
on public.quiz_questions
for delete
to authenticated
using (public.can_manage_quiz(quiz_id));

create policy "Authenticated users can read quiz options"
on public.quiz_options
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = quiz_options.question_id
      and public.can_access_quiz(qq.quiz_id)
  )
);

create policy "Intervenants can create quiz options"
on public.quiz_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = quiz_options.question_id
      and public.can_manage_quiz(qq.quiz_id)
  )
);

create policy "Intervenants can update quiz options"
on public.quiz_options
for update
to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = quiz_options.question_id
      and public.can_manage_quiz(qq.quiz_id)
  )
)
with check (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = quiz_options.question_id
      and public.can_manage_quiz(qq.quiz_id)
  )
);

create policy "Intervenants can delete quiz options"
on public.quiz_options
for delete
to authenticated
using (
  exists (
    select 1
    from public.quiz_questions qq
    where qq.id = quiz_options.question_id
      and public.can_manage_quiz(qq.quiz_id)
  )
);

create policy "Beneficiaries can create own quiz attempts"
on public.quiz_attempts
for insert
to authenticated
with check (
  beneficiary_id = public.current_profile_id()
  and public.is_group_member(group_id)
  and public.can_access_quiz(quiz_id)
);

create policy "Beneficiaries can create own quiz answers"
on public.quiz_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = quiz_answers.attempt_id
      and qa.beneficiary_id = public.current_profile_id()
  )
);

create policy "Authenticated users can read accessible quiz answers"
on public.quiz_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = quiz_answers.attempt_id
      and (
        qa.beneficiary_id = public.current_profile_id()
        or public.can_access_quiz(qa.quiz_id)
      )
  )
);

notify pgrst, 'reload schema';
