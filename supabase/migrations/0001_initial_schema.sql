-- ============================================================
-- Nexpense – Alap séma
-- Futtasd le: supabase db push  VAGY  Supabase Studio SQL editorban
-- ============================================================

-- Felhasználói profil (Supabase auth.users kiterjesztése)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            TEXT,
  avatar_url              TEXT,
  currency                TEXT NOT NULL DEFAULT 'HUF',
  locale                  TEXT NOT NULL DEFAULT 'hu-HU',
  hourly_wage             DECIMAL(12, 2),
  wage_currency           TEXT DEFAULT 'HUF',
  spending_profile        JSONB,          -- Onboarding AI profil
  onboarding_completed_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kategóriák (user_id = NULL → rendszer kategória)
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  name_hu    TEXT,
  icon       TEXT NOT NULL,
  color      TEXT NOT NULL,
  is_system  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Cimkék
CREATE TABLE IF NOT EXISTS public.tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Kiadások
CREATE TABLE IF NOT EXISTS public.expenses (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id               UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount                    DECIMAL(12, 2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'HUF',
  description               TEXT,
  note                      TEXT,
  expense_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_time              TIME,
  location_name             TEXT,
  location_lat              DECIMAL(10, 8),
  location_lng              DECIMAL(11, 8),
  source                    TEXT NOT NULL DEFAULT 'manual'
                            CHECK (source IN ('manual', 'apple_pay', 'suggestion')),
  apple_pay_transaction_id  TEXT,
  is_deleted                BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                  JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date    ON public.expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category     ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_deleted ON public.expenses(user_id, is_deleted);

-- Kiadás ↔ Cimke (N:N)
CREATE TABLE IF NOT EXISTS public.expense_tags (
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, tag_id)
);

-- Impulzus tételek
CREATE TABLE IF NOT EXISTS public.impulse_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  price                DECIMAL(12, 2) NOT NULL,
  currency             TEXT NOT NULL DEFAULT 'HUF',
  url                  TEXT,
  image_url            TEXT,
  store_name           TEXT,
  reason               TEXT,
  category_id          UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  hours_to_earn        DECIMAL(8, 2),
  saved_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notify_at            TIMESTAMPTZ NOT NULL,
  notification_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  decision             TEXT DEFAULT 'pending'
                       CHECK (decision IN ('purchased', 'skipped', 'pending')),
  decided_at           TIMESTAMPTZ,
  converted_expense_id UUID REFERENCES public.expenses(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impulse_user   ON public.impulse_items(user_id);
CREATE INDEX IF NOT EXISTS idx_impulse_notify ON public.impulse_items(notify_at)
  WHERE notification_sent = FALSE AND decision = 'pending';

-- AI beszélgetések
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('impulse_check', 'spending_analysis', 'general', 'onboarding')),
  context_id UUID,
  title      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(conversation_id, created_at ASC);

-- Onboarding válaszok
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_key  TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer        JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_key)
);

-- Helymeghatározás szabályok
CREATE TABLE IF NOT EXISTS public.location_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_name    TEXT,
  place_type    TEXT,
  category_id   UUID NOT NULL REFERENCES public.categories(id),
  suggested_tags UUID[],
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Push token tárolás
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update trigger az updated_at mezőkhöz
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_impulse_items
  BEFORE UPDATE ON public.impulse_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
