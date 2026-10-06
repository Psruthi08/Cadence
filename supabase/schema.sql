create table if not exists public.cadence_sessions (
  owner_id uuid not null,
  session_id text not null,
  session_data jsonb not null check (jsonb_typeof(session_data) = 'object'),
  created_at timestamptz not null default now(),
  primary key (owner_id, session_id)
);

alter table public.cadence_sessions enable row level security;
revoke all on table public.cadence_sessions from anon, authenticated;
grant all on table public.cadence_sessions to service_role;
