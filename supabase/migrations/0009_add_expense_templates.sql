-- Expense templates stored per user for quick-add defaults

CREATE TABLE IF NOT EXISTS public.expense_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  label_ids   UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_expense_templates_user
  ON public.expense_templates(user_id, created_at DESC);

ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sajat sablonok" ON public.expense_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER set_updated_at_expense_templates
  BEFORE UPDATE ON public.expense_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
