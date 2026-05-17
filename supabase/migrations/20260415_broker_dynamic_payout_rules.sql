-- ============================================================
-- FANBE BROKER SYSTEM: Dynamic payout rules + safe broker code
-- ============================================================

-- 1) Ensure pgcrypto exists (for gen_random_uuid in some projects)
create extension if not exists pgcrypto;

-- 2) Sequence-backed broker code to avoid race conditions
create sequence if not exists public.broker_code_seq start 1;

create or replace function public.next_broker_code()
returns text
language plpgsql
security definer
as $$
declare
  next_num bigint;
begin
  next_num := nextval('public.broker_code_seq');
  return 'FNB-' || lpad(next_num::text, 5, '0');
end;
$$;

-- Keep sequence in sync with existing broker_id values (FNB-00001 style)
select setval(
  'public.broker_code_seq',
  greatest(
    coalesce((
      select max(nullif(regexp_replace(broker_id, '^FNB-', ''), '')::bigint)
      from public.brokers
      where broker_id ~ '^FNB-[0-9]+$'
    ), 0),
    1
  ),
  true
);

-- 3) Dynamic rank rules table (used by frontend logic)
create table if not exists public.broker_rank_rules (
  id                  uuid primary key default gen_random_uuid(),
  rank                text unique not null,
  title               text not null,
  commission_percent  numeric(5,2) not null,
  direct_min_sqyd     numeric(12,2) default 0,
  team_qualification  text,
  level_depth         integer not null default 20,
  sort_order          integer not null,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_broker_rank_rules_active_sort
  on public.broker_rank_rules(is_active, sort_order);

-- 4) Seed rank rules from the current static plan (idempotent)
insert into public.broker_rank_rules (rank, title, commission_percent, direct_min_sqyd, team_qualification, level_depth, sort_order)
values
  ('RANK.1',  'EX',               5.00, 100, '100 SQYD (min 1 direct)', 20, 1),
  ('RANK.2',  'SR. EX',            5.50,   0, '750 SQYD',                20, 2),
  ('RANK.3',  'Sales Officer',      6.00,   0, '1250 SQYD',               20, 3),
  ('RANK.4',  'SR S.O',             6.50,   0, '2000 SQYD',               20, 4),
  ('RANK.5',  'Team Manager',       7.00,   0, '3 SR S.O',                20, 5),
  ('RANK.6',  'SR T.M',             7.50,   0, '3 T.M',                   20, 6),
  ('RANK.7',  'Asst. Sales Mgr',    8.00,   0, '3 SR T.M',                20, 7),
  ('RANK.8',  'Sales Mgr',          8.50,   0, '3 Asst. Sales Mgr',       20, 8),
  ('RANK.9',  'Sr. S.M',            9.00,   0, '3 Sales Mgr',             20, 9),
  ('RANK.10', 'Asst. Gen. Mgr',     9.50,   0, '3 Sr. S.M',               20,10),
  ('RANK.11', 'G.M',               10.00,   0, '3 Asst. Gen. Mgr',        20,11),
  ('RANK.12', 'Sr. G.M',           10.50,   0, '3 G.M',                   20,12),
  ('RANK.13', 'Zonal Mgr',         11.00,   0, '3 Sr. G.M',               20,13),
  ('RANK.14', 'Vice President',    11.50,   0, '3 Zonal Mgr',             20,14),
  ('RANK.15', 'President',         12.00,   0, '3 Vice President',        20,15)
on conflict (rank)
do update set
  title = excluded.title,
  commission_percent = excluded.commission_percent,
  direct_min_sqyd = excluded.direct_min_sqyd,
  team_qualification = excluded.team_qualification,
  level_depth = excluded.level_depth,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

-- 5) Optional rule table for bonanza / team rewards (future-ready)
create table if not exists public.broker_reward_rules (
  id            uuid primary key default gen_random_uuid(),
  reward_type   text not null check (reward_type in ('direct_bonanza', 'team_reward')),
  threshold     numeric(14,2) not null,
  threshold_uom text not null default 'sqyd',
  reward_name   text not null,
  sort_order    integer not null default 1,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_broker_reward_rules_type_active_sort
  on public.broker_reward_rules(reward_type, is_active, sort_order);

-- 6) Trigger function to maintain updated_at
create or replace function public.set_updated_at_now()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_broker_rank_rules_updated_at on public.broker_rank_rules;
create trigger trg_broker_rank_rules_updated_at
before update on public.broker_rank_rules
for each row execute function public.set_updated_at_now();
