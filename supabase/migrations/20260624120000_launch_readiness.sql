-- Launch readiness checklist and QA sign-off tracking (ops admin only via service role).

create table if not exists public.launch_checklist_completions (
  item_key text primary key,
  completed boolean not null default false,
  notes text,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.launch_checklist_completions is 'Manual launch checklist item completion state; automated probes are computed at read time.';

create table if not exists public.launch_qa_signoffs (
  test_key text primary key,
  status text not null default 'pending'
    check (status in ('pending', 'passed', 'failed', 'blocked')),
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.launch_qa_signoffs is 'Final QA sign-off tracking for production launch.';

revoke all on public.launch_checklist_completions from anon, authenticated;
revoke all on public.launch_qa_signoffs from anon, authenticated;
grant select, insert, update, delete on public.launch_checklist_completions to service_role;
grant select, insert, update, delete on public.launch_qa_signoffs to service_role;
