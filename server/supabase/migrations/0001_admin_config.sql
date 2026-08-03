-- PDP membership app — admin configuration storage.
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create table if not exists public.admin_config (
  id                   integer primary key default 1,
  google_access_token  text,
  google_refresh_token text,
  google_token_expiry  bigint,
  google_sheet_id      text,
  google_drive_folder_id text,
  last_connected       timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- Enforces a single configuration row, mirroring the SQLite behaviour.
  constraint admin_config_singleton check (id = 1)
);

create table if not exists public.oauth_states (
  state      text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists oauth_states_expires_at_idx
  on public.oauth_states (expires_at);

-- Tokens are secrets. RLS is enabled with NO policies, so the anon and
-- authenticated keys cannot read this table at all; only the service_role
-- key (used exclusively by the backend) bypasses RLS.
alter table public.admin_config enable row level security;
alter table public.oauth_states enable row level security;

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admin_config_touch_updated_at on public.admin_config;
create trigger admin_config_touch_updated_at
  before update on public.admin_config
  for each row execute function public.touch_updated_at();
