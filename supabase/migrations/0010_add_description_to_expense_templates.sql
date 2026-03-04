-- Add optional template description for pre-filling expense note/description

ALTER TABLE public.expense_templates
  ADD COLUMN IF NOT EXISTS description TEXT;

