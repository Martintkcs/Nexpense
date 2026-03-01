-- ============================================================
-- Nexpense – Kategória icon/color felcserélés javítása
-- A 0004 és 0006 migrációkban az icon és color oszlopok
-- véletlenül fel lettek cserélve.
-- Ez a migráció kijavítja a DB-ben lévő adatot.
-- ============================================================

-- PostgreSQL UPDATE-ben a SET jobb oldala az eredeti értékeket
-- használja, tehát a csere egy lépésben biztonságos:
UPDATE public.categories
SET
  icon  = color,
  color = icon
WHERE is_system = TRUE;
