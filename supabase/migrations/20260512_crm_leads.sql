-- Telecaller CRM: leads + interactions
create table if not exists crm_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  alt_phone text,
  email text,
  source text,
  project_id uuid references bp_projects(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'new',          -- new | open | follow_up | hot | booked | lost
  pickup_status text,                          -- picked | not_picked | wrong_number | switched_off
  lost_reason text,
  budget_min numeric,
  budget_max numeric,
  quick_note text,
  tags text[] default '{}',                    -- interested, budget_issue, call_later, site_visit, ...
  next_follow_up_at timestamptz,
  last_called_at timestamptz,
  call_attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_leads_assigned_idx on crm_leads(assigned_to, next_follow_up_at);
create index if not exists crm_leads_status_idx on crm_leads(status);

create table if not exists crm_lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references crm_leads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null,                          -- call | note | sms | whatsapp | status_change | follow_up_set
  note text,
  tags text[] default '{}',
  pickup_status text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists crm_interactions_lead_idx on crm_lead_interactions(lead_id, created_at desc);

alter table crm_leads enable row level security;
alter table crm_lead_interactions enable row level security;

create policy "authenticated read leads" on crm_leads for select to authenticated using (true);
create policy "authenticated write leads" on crm_leads for all  to authenticated using (true) with check (true);
create policy "authenticated read interactions" on crm_lead_interactions for select to authenticated using (true);
create policy "authenticated write interactions" on crm_lead_interactions for all to authenticated using (true) with check (true);
