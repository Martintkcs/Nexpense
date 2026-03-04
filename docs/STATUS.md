# Nexpense - Fejlesztesi Allapot

_Utolso frissites: 2026-03-04_

---

## Osszefoglalo

Nexpense egy iOS-first kolteskoveto alkalmazas impulzusvasarlas-megelozessel, bevetel/kiadas kezelessel es AI tamogatassal.

**Jelenlegi allapot:** a core mobil app funkcionalisan mar eros allapotban van. Az auth, onboarding, dashboard, expenses, analytics, impulse, labels/categories/templates es a dashboardrol indithato AI spending analysis mar be van kotve. A jelenlegi fokusz mar nem az alap feature-ek epitesen, hanem a release-finishing es stabilizalason van.

| Mutato | Ertek |
|--------|-------|
| TypeScript hibak | 0 |
| Expo SDK | 54 |
| React / React Native | 19.1.0 / 0.81.5 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Aktualis fazis | Stabilization + release prep |

---

## Mi mukodik most

### Auth + onboarding

- `welcome.tsx`, `login.tsx`, `register.tsx` mukodik Supabase Auth-tal.
- A regisztracio utan a profil letrejon, az onboarding pedig 10 lepeses.
- Az onboarding vege most mar elmenti a `profiles` rekordba a kovetkezoket:
  - `currency`
  - `wage_currency`
  - `hourly_wage`
  - `starting_balance`
  - `spending_profile`
  - `onboarding_completed_at`
- Az `AuthProvider` mar a profil alapjan donti el, hogy a user onboardingra vagy a tabos appba keruljon.
- A korabbi auth race condition elleni 400 ms-os welcome redirect vedelem megmaradt.

### Dashboard

**Fajl:** `apps/mobile/app/(tabs)/index.tsx`

- Havi egyenlegkartya mukodik.
- A havi bevetel es havi kiadas kulon jelenik meg.
- Az utolso tranzakciok listaja mukodik szerveres adatokkal.
- A rekordok szerkesztesere a quick-add modal nyilik edit modban.
- A dashboardrol mar indithato AI spending analysis.

### Expenses + quick add

**Fajlok:** `apps/mobile/app/(tabs)/expenses/index.tsx`, `apps/mobile/app/modals/quick-add.tsx`

- Valodi Supabase lista.
- Swipe-to-delete optimista update-tel.
- Kereses es kategoriak szerinti szures.
- Pull-to-refresh.
- A quick-add modal mar nem csak kiadasra jo:
  - kiadas rogzitese
  - bevetel rogzitese
  - meglevo tetel szerkesztese
  - kategoriavalasztas
  - label valasztas
  - uj label letrehozas inline
  - sablon alkalmazasa

### Analytics

**Fajl:** `apps/mobile/app/(tabs)/analytics/index.tsx`

- Heti es havi nezet.
- Osszesito kartyak.
- Napi oszlopdiagram.
- Kategoria bontas.
- Insight blokk.
- Ures allapotok es refresh mukodik.

### Settings

**Fajlok:** `apps/mobile/app/(tabs)/settings/*`

Fo settings oldal:
- profil kartya
- push toggle
- location toggle
- Apple Pay detection toggle
- dark mode toggle
- logout

Kulon aloldalak:
- `finance.tsx`
  - oraber
  - deviza
- `categories.tsx`
  - egyeni kategoriak CRUD
- `labels.tsx`
  - label CRUD
- `templates.tsx`
  - sablon CRUD

### Templates

- A sablonok mar nem csak lokalis AsyncStorage-ban elnek.
- Uj Supabase tabla: `expense_templates`
- Kategoria + `label_ids` tomb tarolodik szerveroldalon.
- A migration `0009_add_expense_templates.sql` elkeszult es lefutott.

### Impulse modul

**Fajlok:** `apps/mobile/app/(tabs)/impulse/index.tsx`, `apps/mobile/app/(tabs)/impulse/new.tsx`

- Impulzus tetel letrehozas mukodik.
- `impulse_items` tabla be van kotve.
- 24 oras gondolkodasi ido megjelenik.
- Munkaora kalkulacio mukodik.
- Dontes: `purchased` / `skipped`
- History lista mukodik.
- Megtakaritasi osszeg valos adatokbol szamolodik.

### Notifications

**Fajlok:** `apps/mobile/src/services/notifications.ts`, `apps/mobile/src/services/supabase/pushTokens.ts`

- Permission kerese mukodik.
- Android channel be van allitva.
- Foreground notification handler Expo SDK 54-kompatibilis.
- Push token mentese adatbazisba mukodik.
- Token deaktivalasa logoutnal megvan.
- Notification tap -> impulse screen navigacio megvan.
- `scheduled-impulse-check` Edge Function hasznalatban van.
- Cron schedule: `*/15 * * * *`

Megjegyzes:
- a lokalis impulse notification mar 24 oras delay-jel megy.

### AI

**Kliens:**
- `apps/mobile/app/modals/ai-chat.tsx`
- `apps/mobile/src/services/ai/claude.ts`

**Backend:**
- `supabase/functions/ai-chat/index.ts`

Mi kesz:
- AI chat modal UI
- SSE stream kliensoldalon
- dashboard spending analysis inditas
- Supabase Edge Function proxy Anthropic fele

Mi nincs meg teljesen:
- production deploy es env ellenorzes
- impulse_check flow teljes termekes bekotese
- konverzaciok/perzisztencia melyitese

---

## Adatbazis

### Fontos tablák

- `profiles`
- `expenses`
- `categories`
- `tags`
- `expense_templates`
- `impulse_items`
- `push_tokens`
- `ai_conversations`
- `ai_messages`

### Migraiok

| Fajl | Allapot |
|------|---------|
| `0001_initial_schema.sql` | lefutott |
| `0002_rls_policies.sql` | lefutott |
| `0003_rpc_functions.sql` | lefutott |
| `0004_seed_categories.sql` | lefutott |
| `0005_fix_profiles_rls_and_trigger.sql` | lefutott |
| `0006_fix_category_ids.sql` | lefutott |
| `0007_fix_category_icon_color_swap.sql` | lefutott |
| `0008_add_income_support.sql` | lefutott |
| `0009_add_expense_templates.sql` | lefutott |

---

## Jelenlegi technikai allapot

- `cmd /c npx tsc --noEmit` tiszta.
- A mobil app jelenlegi hangsulya: feature closure helyett stabilizalas.
- A dokumentacio most mar kozelebb van a valos allapothoz, de runtime smoke test tovabbra is kell minden nagyobb release elott.

---

## Ismert hianyossagok

| # | Hianyossag | Prioritas |
|---|------------|-----------|
| 1 | Dark mode toggle van, de a UI meg nem temazhato ra teljesen | Alacsony |
| 2 | AI chat Edge Function production deploy es env ellenorzes meg nincs lezarva | Kozepes |
| 3 | EAS submit mezokben placeholder ertekek vannak | Kozepes |
| 4 | Templates migration utan erdemes runtime smoke testet futtatni | Kozepes |

---

## Kovetkezo lepesek

### 1. Release-finishing

- [ ] EAS submit / build config veglegesitese
- [ ] AI Edge Function env (`ANTHROPIC_API_KEY`) es deploy ellenorzese

### 2. Runtime ellenorzes

- [ ] onboarding vegigtesztelese uj userrel
- [ ] templates CRUD + quick-add template apply smoke test
- [ ] income + expense edit flow vegigtesztelese
- [ ] impulse notification teljes flow ellenorzese

### 3. Opcionális kovetkezo termeklepések

- [ ] impulse_check AI flow teljes bekotese
- [ ] dark mode tenyleges UI tamogatas
- [ ] sablonokhoz tovabbi metadata vagy alapertelmezett osszeg tamogatas

---

## Inditas

```bash
cd E:/Nexpense/apps/mobile
npx expo start
```

> Fontos: az appot az `apps/mobile` mappabol erdemes inditani.
