-- ============================================================================
-- Website lead capture without exposing the leads table
-- ============================================================================
-- Around 15 Sep 2026 the permissive "Allow all access to leads" policy and the
-- anon GRANT on public.leads were removed. That was the right call: the anon
-- key ships inside the browser bundle, so anyone holding it could read all
-- ~6,000 customer names and phone numbers. But it also silently broke website
-- lead capture — the enquiry emails kept arriving while nothing reached the
-- CRM, so every website lead after that date is missing from the table.
--
-- This restores capture without reopening the table. anon gets EXECUTE on one
-- SECURITY DEFINER function and nothing else: it can submit a lead, and it
-- still cannot read, update or delete a single row.
--
-- The function also does the duplicate check server-side, which the browser
-- can no longer do (it has no SELECT), so a repeat enquiry appends to the
-- existing lead instead of creating another row.
-- ============================================================================

create or replace function public.submit_website_lead(
  p_phone          text,
  p_name           text default '',
  p_email          text default '',
  p_project        text default null,
  p_source         text default 'WhatsApp',
  p_interest_level text default 'Hot',
  p_label          text default 'WhatsApp enquiry',
  p_details        text default ''
)
returns jsonb
language plpgsql
security definer
-- Pinned so a caller cannot shadow the tables/functions this body resolves.
set search_path = public, pg_temp
as $$
declare
  v_ten       text;
  v_phone     text;
  v_source    text;
  v_interest  text;
  v_name      text;
  v_when      text;
  v_note      text;
  v_id        uuid;
  v_old_notes text;
begin
  -- ── Normalise + validate the number ───────────────────────────────────────
  v_ten := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  if v_ten !~ '^[6-9][0-9]{9}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  v_phone := '+91' || v_ten;

  -- ── Clamp everything the browser controls ─────────────────────────────────
  -- anon calls this, so no free-text field is trusted for length, and source
  -- and interest are restricted to the values the CRM filters on.
  v_source   := case when p_source in ('WhatsApp', 'Website') then p_source else 'Website' end;
  v_interest := case when p_interest_level in ('Hot', 'Warm', 'Cold') then p_interest_level else 'Warm' end;
  v_name     := nullif(btrim(left(coalesce(p_name, ''), 120)), '');

  -- Server time in IST, not whatever the visitor's phone clock said.
  v_when := to_char(now() at time zone 'Asia/Kolkata', 'FMDD/FMMM/YYYY, FMHH12:MI:SS am');

  -- ── Already known? Append the enquiry, don't duplicate the lead ───────────
  -- Matches every phone shape the table has accumulated across importers.
  select id, notes into v_id, v_old_notes
    from public.leads
   where phone in (v_phone, v_ten, '91' || v_ten, '0' || v_ten)
   order by created_at desc
   limit 1;

  if v_id is not null then
    v_note := '🔁 Repeat ' || left(coalesce(p_label, 'enquiry'), 60) || ' from website — ' || v_when
              || case when coalesce(p_details, '') = '' then '' else E'\n' || left(p_details, 4000) end;
    update public.leads
       set notes      = left(v_note || E'\n\n' || coalesce(v_old_notes, ''), 8000),
           updated_at = now()
     where id = v_id;
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  -- ── New lead ──────────────────────────────────────────────────────────────
  v_note := '🟢 ' || left(coalesce(p_label, 'enquiry'), 60) || ' from website — ' || v_when
            || case when coalesce(p_details, '') = '' then '' else E'\n' || left(p_details, 4000) end;

  insert into public.leads (
    name, full_name, phone, email, source, status, final_status,
    interest_level, notes, site_visit_status, project, created_at, updated_at
  ) values (
    coalesce(v_name, v_source || ' Enquiry'),
    coalesce(v_name, v_source || ' Enquiry'),
    v_phone,
    left(coalesce(p_email, ''), 160),
    v_source,
    'Active',
    'FollowUp',
    v_interest,
    v_note,
    'not_planned',
    nullif(btrim(left(coalesce(p_project, ''), 120)), ''),
    now(), now()
  );

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.submit_website_lead is
  'Public website lead capture. The only write path anon has into leads — it holds no table grant.';

-- ── Permissions ─────────────────────────────────────────────────────────────
-- EXECUTE on this function is the whole of anon''s access. Deliberately no
-- GRANT on public.leads: the browser can submit and nothing else.
revoke all on function public.submit_website_lead(text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_website_lead(text, text, text, text, text, text, text, text) to anon, authenticated;
