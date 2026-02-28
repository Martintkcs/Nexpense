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
