-- ============================================================
-- FANBE BROKER PAYOUT SYSTEM — Supabase Migration
-- Run this once in Supabase SQL Editor
-- ============================================================

-- 1. BROKERS TABLE
CREATE TABLE IF NOT EXISTS public.brokers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id       TEXT UNIQUE NOT NULL,          -- e.g. FNB-00042
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  rank            TEXT NOT NULL DEFAULT 'RANK.1',
  parent_id       UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  referral_code   TEXT UNIQUE NOT NULL,          -- share this to recruit
  status          TEXT NOT NULL DEFAULT 'active', -- active | suspended
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BROKER SALES TABLE
CREATE TABLE IF NOT EXISTS public.broker_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id       UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  project         TEXT NOT NULL,
  sqyd            NUMERIC NOT NULL DEFAULT 0,
  sale_amount     NUMERIC NOT NULL DEFAULT 0,
  booking_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | pending | cancelled
  notes           TEXT,
  added_by        UUID REFERENCES public.brokers(id), -- admin who added
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BROKER PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.broker_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id       UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  sale_id         UUID REFERENCES public.broker_sales(id),
  amount          NUMERIC NOT NULL,
  payout_type     TEXT NOT NULL, -- direct_commission | level_commission | bonanza | team_reward
  level           INT DEFAULT 0, -- 0=own, 1=parent, 2=grandparent
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | paid
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_brokers_parent_id     ON public.brokers(parent_id);
CREATE INDEX IF NOT EXISTS idx_brokers_referral_code ON public.brokers(referral_code);
CREATE INDEX IF NOT EXISTS idx_broker_sales_broker   ON public.broker_sales(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_payouts_broker ON public.broker_payouts(broker_id);

-- 5. RLS — disable for now (broker portal uses service role)
ALTER TABLE public.brokers        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_sales   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_payouts DISABLE ROW LEVEL SECURITY;

-- 6. Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_brokers_updated_at ON public.brokers;
CREATE TRIGGER set_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
