-- ============================================================
-- Nexpense – Profil trigger és RLS javítás
-- Futtasd le Supabase Studio SQL editorban!
-- ============================================================

-- Fix 1: Trigger helyes metaadat mezőt olvas (display_name, nem full_name)
-- + ON CONFLICT DO NOTHING → ha az app-oldal upsert hamarabb fut, nem dob hibát
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Saját profil INSERT policy (az app-oldali upsert-hez kell)
-- Eddig csak SELECT és UPDATE policy volt, INSERT nem → upsert RLS-en bukott el
DROP POLICY IF EXISTS "Saját profil létrehozás" ON public.profiles;
CREATE POLICY "Saját profil létrehozás"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Fix 3: Meglévő nem megerősített tesztelési accountok megerősítése
-- (ha email-megerősítés be van kapcsolva és vannak pending userek)
-- Futtasd ha szükséges:
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
