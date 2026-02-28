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


-- ============================================================

-- ============================================================
-- Nexpense – Row Level Security (RLS) szabályok
-- Mindenki csak a saját adatát láthatja és módosíthatja
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impulse_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens      ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Saját profil olvasás"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Saját profil frissítés" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES – rendszer kategóriák mindenki látja, egyéni csak saját
CREATE POLICY "Kategóriák olvasás" ON public.categories FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Egyéni kategória létrehozás" ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Egyéni kategória módosítás" ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Egyéni kategória törlés" ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- TAGS
CREATE POLICY "Saját cimkék" ON public.tags FOR ALL USING (auth.uid() = user_id);

-- EXPENSES
CREATE POLICY "Saját kiadások" ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- EXPENSE_TAGS (RLS az expense táblán keresztül érvényesül)
CREATE POLICY "Saját kiadás cimkék" ON public.expense_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.expenses WHERE id = expense_id AND user_id = auth.uid()));

-- IMPULSE_ITEMS
CREATE POLICY "Saját impulzus tételek" ON public.impulse_items FOR ALL USING (auth.uid() = user_id);

-- AI_CONVERSATIONS
CREATE POLICY "Saját AI beszélgetések" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

-- AI_MESSAGES (az ai_conversations táblán keresztül)
CREATE POLICY "Saját AI üzenetek" ON public.ai_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- ONBOARDING_RESPONSES
CREATE POLICY "Saját onboarding válaszok" ON public.onboarding_responses FOR ALL USING (auth.uid() = user_id);

-- LOCATION_RULES
CREATE POLICY "Saját helymeghatározás szabályok" ON public.location_rules FOR ALL USING (auth.uid() = user_id);

-- PUSH_TOKENS
CREATE POLICY "Saját push token" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);


-- ============================================================

-- ============================================================
-- Nexpense – Analytics RPC Függvények
-- ============================================================

-- Havi összesítő
CREATE OR REPLACE FUNCTION public.get_monthly_summary(
  p_user_id UUID,
  p_year    INTEGER,
  p_month   INTEGER
)
RETURNS TABLE (
  total_amount       DECIMAL,
  transaction_count  BIGINT,
  top_category_id    UUID,
  avg_per_day        DECIMAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(amount), 0)  AS total_amount,
    COUNT(*)                   AS transaction_count,
    (SELECT category_id FROM public.expenses
     WHERE user_id = p_user_id AND is_deleted = FALSE
       AND EXTRACT(YEAR FROM expense_date) = p_year
       AND EXTRACT(MONTH FROM expense_date) = p_month
       AND category_id IS NOT NULL
     GROUP BY category_id ORDER BY SUM(amount) DESC LIMIT 1) AS top_category_id,
    COALESCE(SUM(amount) / NULLIF(COUNT(DISTINCT expense_date), 0), 0) AS avg_per_day
  FROM public.expenses
  WHERE user_id = p_user_id
    AND is_deleted = FALSE
    AND EXTRACT(YEAR FROM expense_date) = p_year
    AND EXTRACT(MONTH FROM expense_date) = p_month;
$$;

-- Kategória részletezés (időszakra)
CREATE OR REPLACE FUNCTION public.get_category_breakdown(
  p_user_id   UUID,
  p_start     DATE,
  p_end       DATE
)
RETURNS TABLE (
  category_id       UUID,
  category_name     TEXT,
  category_icon     TEXT,
  category_color    TEXT,
  total_amount      DECIMAL,
  transaction_count BIGINT,
  percentage        DECIMAL
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH totals AS (
    SELECT SUM(amount) AS grand_total
    FROM public.expenses
    WHERE user_id = p_user_id AND is_deleted = FALSE
      AND expense_date BETWEEN p_start AND p_end
  )
  SELECT
    c.id,
    c.name,
    c.icon,
    c.color,
    COALESCE(SUM(e.amount), 0),
    COUNT(e.id),
    ROUND(COALESCE(SUM(e.amount), 0) / NULLIF((SELECT grand_total FROM totals), 0) * 100, 1)
  FROM public.categories c
  LEFT JOIN public.expenses e
    ON e.category_id = c.id
    AND e.user_id = p_user_id
    AND e.is_deleted = FALSE
    AND e.expense_date BETWEEN p_start AND p_end
  WHERE c.user_id IS NULL OR c.user_id = p_user_id
  GROUP BY c.id, c.name, c.icon, c.color
  HAVING SUM(e.amount) > 0
  ORDER BY SUM(e.amount) DESC NULLS LAST;
$$;

-- Napi trendek (elmúlt N hónap)
CREATE OR REPLACE FUNCTION public.get_spending_trends(
  p_user_id    UUID,
  p_months_back INTEGER DEFAULT 6
)
RETURNS TABLE (
  month        DATE,
  total_amount DECIMAL,
  avg_amount   DECIMAL,
  tx_count     BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    DATE_TRUNC('month', expense_date)::DATE AS month,
    SUM(amount),
    AVG(amount),
    COUNT(*)
  FROM public.expenses
  WHERE user_id = p_user_id
    AND is_deleted = FALSE
    AND expense_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', expense_date)
  ORDER BY month ASC;
$$;

-- Hét napja szerinti statisztika
CREATE OR REPLACE FUNCTION public.get_day_of_week_stats(
  p_user_id    UUID,
  p_months_back INTEGER DEFAULT 3
)
RETURNS TABLE (
  day_of_week  INTEGER,  -- 0=vasárnap, 1=hétfő, ... 6=szombat
  avg_amount   DECIMAL,
  total_amount DECIMAL,
  tx_count     BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    EXTRACT(DOW FROM expense_date)::INTEGER AS day_of_week,
    AVG(amount),
    SUM(amount),
    COUNT(*)
  FROM public.expenses
  WHERE user_id = p_user_id
    AND is_deleted = FALSE
    AND expense_date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
  GROUP BY EXTRACT(DOW FROM expense_date)
  ORDER BY day_of_week;
$$;


-- ============================================================

-- ============================================================
-- Nexpense – Rendszer kategóriák (seed adatok)
-- user_id = NULL → mindenki látja
-- ============================================================

INSERT INTO public.categories (name, name_hu, icon, color, is_system, sort_order) VALUES
  ('food',           'Étel & Ital',          '🍽️',  '#F97316', TRUE,  1),
  ('transport',      'Közlekedés',            '🚌',  '#3B82F6', TRUE,  2),
  ('shopping',       'Vásárlás & Ruha',       '🛍️',  '#EC4899', TRUE,  3),
  ('entertainment',  'Szórakozás',            '🎬',  '#8B5CF6', TRUE,  4),
  ('health',         'Egészség & Gyógyszer',  '💊',  '#10B981', TRUE,  5),
  ('housing',        'Lakás',                 '🏠',  '#6366F1', TRUE,  6),
  ('utilities',      'Rezsik & Számlák',      '⚡',  '#64748B', TRUE,  7),
  ('subscriptions',  'Előfizetések',          '🎵',  '#EF4444', TRUE,  8),
  ('education',      'Oktatás & Könyvek',     '📚',  '#0EA5E9', TRUE,  9),
  ('travel',         'Utazás & Nyaralás',     '✈️',  '#06B6D4', TRUE, 10),
  ('personal',       'Személyes gondoskodás', '💆',  '#F472B6', TRUE, 11),
  ('gifts',          'Ajándékok',             '🎁',  '#FB7185', TRUE, 12),
  ('savings',        'Megtakarítás',          '🏦',  '#34D399', TRUE, 13),
  ('other',          'Egyéb',                 '📦',  '#9CA3AF', TRUE, 14)
ON CONFLICT DO NOTHING;
