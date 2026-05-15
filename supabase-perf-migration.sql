-- ─────────────────────────────────────────────────────────────────────────
-- Fanbe-CRM RLS performance + security migration
-- ─────────────────────────────────────────────────────────────────────────
-- NOT yet applied. Run this in Supabase SQL editor after confirming a
-- recent backup. Expected impact: 5–10× faster leads queries against the
-- 4753-row `public.leads` table, and closes a real security hole.
--
-- WHY each change is here:
--
--   (1) The `Allow all access to *` policies grant `qual=true` to role
--       `public`. That means anyone with the publishable/anon key can
--       SELECT / INSERT / UPDATE / DELETE every row in those tables.
--       This bypasses RLS entirely AND adds eval cost on every query
--       because PostgreSQL still checks all permissive policies.
--
--   (2) The "Employees can ..." policies on leads duplicate the
--       `leads_*_by_role` policies but target role `public` and call
--       `auth.uid()` per row. Drop them — coverage is already provided
--       by `leads_*_by_role` which target `authenticated`.
--
--   (3) The `leads_*_by_role` policies call `auth.uid()` per row. Wrap
--       in `(select auth.uid())` so PostgreSQL evaluates once per
--       statement instead of once per row. See:
--       https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

-- (1) Drop wide-open policies on 6 tables
DROP POLICY IF EXISTS "Allow all access to leads"            ON public.leads;
DROP POLICY IF EXISTS "Allow all access to calls"            ON public.calls;
DROP POLICY IF EXISTS "Allow all access to site_visits"      ON public.site_visits;
DROP POLICY IF EXISTS "Allow all access to bookings"         ON public.bookings;
DROP POLICY IF EXISTS "Allow all access to tasks"            ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to bp_payment_queue" ON public.bp_payment_queue;

-- (2) Drop the redundant `public`-role employee policies on leads
DROP POLICY IF EXISTS "Employees can create manual leads"        ON public.leads;
DROP POLICY IF EXISTS "Employees can update their assigned leads" ON public.leads;

-- (3) Refactor remaining `leads` policies for per-statement uid()
ALTER POLICY leads_select_by_role ON public.leads
  USING (
    is_super_admin() OR is_sales_manager()
    OR (assigned_to = (SELECT auth.uid()))
    OR (created_by  = (SELECT auth.uid()))
  );

ALTER POLICY leads_update_by_role ON public.leads
  USING (
    is_super_admin() OR is_sales_manager()
    OR (assigned_to = (SELECT auth.uid()))
    OR (created_by  = (SELECT auth.uid()))
  )
  WITH CHECK (
    is_super_admin() OR is_sales_manager()
    OR (assigned_to = (SELECT auth.uid()))
    OR (created_by  = (SELECT auth.uid()))
  );

ALTER POLICY leads_insert_by_role ON public.leads
  WITH CHECK (
    is_super_admin() OR is_sales_manager()
    OR (is_sales_executive()
        AND created_by = (SELECT auth.uid())
        AND (assigned_to = (SELECT auth.uid()) OR assigned_to IS NULL))
  );

COMMIT;

-- After running, re-run `supabase advisors` to confirm the
-- `multiple_permissive_policies` count drops and the `auth_rls_initplan`
-- warnings on `leads` are resolved.
