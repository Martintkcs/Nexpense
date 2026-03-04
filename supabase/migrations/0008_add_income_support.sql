-- ─── Migration 0008: Income support ──────────────────────────────────────────
-- Adds transaction type (expense/income) to expenses table
-- Adds starting_balance to profiles table

DO $$ BEGIN
  -- Add 'type' column to expenses (default 'expense' for all existing rows)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'expenses'
      AND column_name  = 'type'
  ) THEN
    ALTER TABLE public.expenses
      ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'
        CHECK (type IN ('expense', 'income'));
  END IF;

  -- Add 'starting_balance' to profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'starting_balance'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN starting_balance NUMERIC NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Index to speed up balance queries (SUM by type)
CREATE INDEX IF NOT EXISTS idx_expenses_user_type
  ON public.expenses (user_id, type)
  WHERE is_deleted = false;
