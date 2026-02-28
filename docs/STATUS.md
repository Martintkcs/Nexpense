# Nexpense – Fejlesztési Állapot

_Utolsó frissítés: 2026-02-28 — Fázis 2 befejezve_

---

## Összefoglaló

Nexpense egy iOS-first kiadáskövető alkalmazás impulzusvásárlás-megelőzéssel és AI funkciókkal.
**Jelenlegi állapot:** Fázis 2 teljes — valódi Supabase backend, auth, CRUD. Fázis 3 következik.

| Mutató | Érték |
|--------|-------|
| TypeScript hibák | ✅ 0 |
| Expo SDK | 54 (Expo Go 54.0.2 kompatibilis) |
| React / RN | 19.1.0 / 0.81.5 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Fázis | Fázis 2 befejezve |

---

## Mi működik most (Fázis 1 + 2)

### Autentikáció
| Képernyő | Működik | Leírás |
|----------|---------|--------|
| `welcome.tsx` | ✅ | Nyitóképernyő → Regisztráció vagy Bejelentkezés |
| `login.tsx` | ✅ | `supabase.auth.signInWithPassword()`, hibakezelés, magyar hibaüzenetek |
| `register.tsx` | ✅ | `supabase.auth.signUp()` + `display_name` metaadatban, DB trigger létrehoz profilt |
| `onboarding/[step].tsx` | ✅ | 10 lépéses onboarding, kijelölés + Tovább gomb, utolsó lépésnél közvetlen belépés |

**Auth flow részletek:**
- `AuthProvider.tsx` hallgatja az `onAuthStateChange` eseményeket
- 400ms debounce a welcome-ra redirect előtt (race condition megelőzés regisztráció után)
- `session && inAuthGroup && !inOnboarding` → `/(tabs)` redirect
- `!session && !inAuthGroup` → `/(auth)/welcome` (400ms késleltetéssel)
- `signOut()` elérhető a `useAuth()` hookból

---

### Főoldal (Dashboard)
**Fájl:** `app/(tabs)/index.tsx`

| Elem | Működik | Leírás |
|------|---------|--------|
| Üdvözlés | ✅ | Felhasználó keresztneve `user.user_metadata.display_name`-ből |
| Havi összeg | ✅ | Valódi adat `useMonthlyExpenses()` alapján |
| Tétel szám | ✅ | Havi tranzakciók száma |
| Legutóbbi kiadások | ✅ | Utolsó 5 tétel, kategória ikonnal + színnel |
| Pull-to-refresh | ✅ | Lehúzásra frissít |
| Üres állapot | ✅ | Ha nincs kiadás, útmutatóval |
| FAB gomb | ✅ | `+` → quick-add modal megnyitás |
| AI összefoglaló | 🔜 | Placeholder — Fázis 3 |

---

### Kiadások lista
**Fájl:** `app/(tabs)/expenses/index.tsx`

| Elem | Működik | Leírás |
|------|---------|--------|
| Valódi lista | ✅ | `useExpenses()` → Supabase, is_deleted=false szűrés |
| Napokra csoportosítás | ✅ | MA / TEGNAP / teljes dátum fejlécekkel |
| Swipe-to-delete | ✅ | Balra húzás → piros 🗑 panel → optimista törlés + rollback |
| Kereső | ✅ | Client-side, description + kategória névben |
| Kategória szűrők | ✅ | Csak azon kategoriak chipként, amelyek tényleg szerepelnek az adatokban |
| Pull-to-refresh | ✅ | |
| Üres állapot | ✅ | Keresési és adatnélküli esetekre külön üzenet |
| `+ Kiadás hozzáadása` | ✅ | Quick-add modalt nyit |

**Swipe-delete technikai részlet:** Optimista update — az item azonnal eltűnik a cache-ből, ha a szerver hívás meghibásodik, automatikusan visszaáll.

---

### Quick-add modal
**Fájl:** `app/modals/quick-add.tsx`

| Elem | Működik |
|------|---------|
| Számpad (1–9, 000, 0, ⌫) | ✅ |
| 8 kategória rács | ✅ |
| Mentés Supabase-be | ✅ |
| Betöltés indicator | ✅ |
| Sikeres mentés után bezár | ✅ |
| Cache invalidálás (dashboard + lista frissül) | ✅ |

---

### Kimutatások
**Fájl:** `app/(tabs)/analytics/index.tsx`

| Elem | Működik | Leírás |
|------|---------|--------|
| Időszak választó | ✅ | „Ezen a héten" / „Ebben a hónapban" |
| Heti nézet | ✅ | H–V szűrés az aktuális hétre |
| Havi nézet | ✅ | Teljes aktuális hónap |
| Összesítő kártya | ✅ | Valódi összeg + tranzakció szám |
| Oszlopdiagram | ✅ | Valódi napi összegek, ma indigóval kiemelve |
| Kategória bontás | ✅ | Összeg, %, progress bar, kategória szín |
| Insight kártya | ✅ | Legtöbbet költött kategória kiemelése |
| Pull-to-refresh | ✅ | |
| Üres állapot | ✅ | Heti / havi üres esetekre |

---

### Beállítások
**Fájl:** `app/(tabs)/settings/index.tsx`

| Elem | Működik | Leírás |
|------|---------|--------|
| Profil kártya | ✅ | Valódi név + email Supabase-ből, monogram avatar |
| Órabér beállítás | ✅ | Középre pozicionált modal, `KeyboardAvoidingView`, menti `profiles.hourly_wage`-be |
| Deviza választó | ✅ | HUF / EUR / USD, menti `profiles.currency`-be |
| Push értesítések toggle | ✅ | Lokális állapot (AsyncStorage) |
| Helymeghatározás toggle | ✅ | Lokális állapot |
| Apple Pay észlelés toggle | ✅ | Lokális állapot |
| Sötét mód toggle | ✅ | Lokális állapot (UI nem reagál rá még) |
| Kijelentkezés | ✅ | Alert megerősítés → `supabase.auth.signOut()` |

---

### Impulzus modul
**Fájl:** `app/(tabs)/impulse/index.tsx`, `impulse/new.tsx`

| Elem | Működik | Leírás |
|------|---------|--------|
| UI váz | ✅ | Megtakarítás kártya, figyelmeztetés banner, tétel kártyák |
| Munkaóra kalkulátor | ✅ | Megmutatja hány óra munka az adott ár |
| Új tétel form | ✅ | Név, ár, bolt, URL, indok mezők |
| Valódi Supabase mentés | 🔜 | Fázis 3 |
| Döntés (megvettem/megspóroltam) | 🔜 | Fázis 3 |
| 24h timer | 🔜 | Fázis 3 |

---

## Adatbázis struktúra (Supabase)

### Táblák
| Tábla | Leírás |
|-------|--------|
| `profiles` | Felhasználói profil (`display_name`, `hourly_wage`, `currency`, `spending_profile`) |
| `expenses` | Kiadások (`amount`, `category_id`, `expense_date`, `description`, `is_deleted`) |
| `categories` | 14 rendszer + egyedi kategóriák (`icon`, `color`, `name_hu`) |
| `impulse_items` | Impulzus tételek (`price`, `decision`, `notify_at`, `hours_to_earn`) |
| `tags` | Egyedi cimkék |
| `expense_tags` | Kiadás ↔ cimke N:N tábla |
| `ai_conversations` | AI beszélgetések |
| `ai_messages` | AI üzenetek |
| `onboarding_responses` | Onboarding válaszok (még nem használt) |
| `location_rules` | Helyszín alapú kategória szabályok |
| `push_tokens` | Push értesítési tokenek |

### Migrációk (már futtatva)
| Fájl | Tartalom |
|------|----------|
| `0001_initial_schema.sql` | Táblák, indexek, triggerek |
| `0002_rls_policies.sql` | Row Level Security minden táblán |
| `0003_rpc_functions.sql` | `get_monthly_summary()` és 3 további RPC |
| `0004_seed_categories.sql` | 14 rendszerkategória (HUF alapon) |

### Edge Functions (Deno — kész de még nem aktív)
| Függvény | Leírás |
|----------|--------|
| `functions/ai-chat/` | Claude API proxy SSE streaminggel |
| `functions/scheduled-impulse-check/` | Cron: 24h lejárt impulzusoknál push értesítés |

---

## Tech Stack

| Réteg | Technológia | Verzió |
|-------|-------------|--------|
| Mobilalkalmazás | React Native + Expo Managed | SDK 54 |
| Routing | Expo Router (file-based) | ~6.0.23 |
| UI | StyleSheet + `@expo/vector-icons` Ionicons | — |
| Animáció | react-native-reanimated | ~4.1.1 |
| Gesztusok | react-native-gesture-handler | ~2.28.0 |
| Stílus (CSS) | NativeWind v4 (Tailwind) | 4.1.23 |
| Szerver state | TanStack Query v5 | 5.90.21 |
| Lokális state | Zustand v5 + AsyncStorage persist | 5.0.11 |
| Backend | Supabase (PostgreSQL + Auth + Edge) | 2.98.0 |
| AI (tervezett) | Anthropic Claude (Sonnet / Haiku) | — |
| TypeScript | — | ~5.9.2 |
| React | — | 19.1.0 |
| React Native | — | 0.81.5 |

---

## Architektúra

```
apps/mobile/
├── app/
│   ├── _layout.tsx              ← GestureHandler + QueryProvider + AuthProvider
│   ├── (auth)/
│   │   ├── welcome.tsx
│   │   ├── login.tsx            ← supabase.auth.signInWithPassword
│   │   ├── register.tsx         ← supabase.auth.signUp
│   │   └── onboarding/[step].tsx← 10 lépés, kijelölés + Tovább gomb
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Ionicons tab ikonok
│   │   ├── index.tsx            ← Dashboard (valódi adatok)
│   │   ├── expenses/index.tsx   ← Lista + swipe-delete
│   │   ├── analytics/index.tsx  ← Grafikonok + kategória bontás
│   │   ├── impulse/             ← UI kész, DB még nem
│   │   └── settings/index.tsx   ← Profil + beállítások
│   └── modals/
│       ├── quick-add.tsx        ← Számpad + mentés
│       ├── apple-pay-detected.tsx
│       └── ai-chat.tsx
├── src/
│   ├── providers/
│   │   ├── AuthProvider.tsx     ← Session + navigáció guard (400ms race fix)
│   │   └── QueryProvider.tsx    ← TanStack Query konfig
│   ├── hooks/
│   │   ├── useExpenses.ts       ← CRUD + optimistic delete
│   │   ├── useCategories.ts     ← Fetch + SYSTEM_CATEGORIES fallback
│   │   └── useProfile.ts        ← Profil fetch + settingsStore sync
│   ├── services/supabase/
│   │   ├── client.ts            ← Singleton kliens, AsyncStorage session
│   │   ├── expenses.ts          ← fetchExpenses, fetchMonthly, create, delete
│   │   ├── categories.ts        ← fetchCategories (rendszer + egyedi)
│   │   └── profiles.ts          ← fetchProfile, updateProfile
│   ├── stores/
│   │   ├── settingsStore.ts     ← Zustand (deviza, órabér, kapcsolók)
│   │   └── expenseStore.ts      ← Zustand (legacy, TanStack Query váltotta fel)
│   ├── types/
│   │   └── database.ts          ← Supabase JS v2 kompatibilis típusok
│   └── lib/
│       ├── constants.ts         ← COLORS, SYSTEM_CATEGORIES, DEFAULT_CURRENCY
│       └── currency.ts          ← formatCurrency, calcWorkHours
```

---

## Ismert kisebb hiányosságok

| # | Hiányosság | Prioritás |
|---|-----------|-----------|
| 1 | Onboarding válaszok nem kerülnek DB-be (`profiles.spending_profile`) | Alacsony |
| 2 | Impulzus képernyő adatok hardcodeolva (Fázis 3) | Közepes |
| 3 | `settingsStore.onboardingCompleted` nincs bekötve (ismételt login skip) | Alacsony |
| 4 | EAS Project ID placeholder az `app.config.ts`-ben (csak production buildhöz kell) | Alacsony |
| 5 | Sötét mód toggle van, de a UI nem reagál rá | Alacsony |

---

## Következő lépések (Fázis 3)

### Impulzus modul (Fázis 3A)
- [ ] `impulse_items` tábla bekötése az impulzus képernyőre
- [ ] Valódi mentés: `impulse/new.tsx` → Supabase insert
- [ ] Döntés kezelés: „Megvettem" / „Megspóroltam" gomb → `decision` mező frissítés
- [ ] 24 órás visszaszámláló a tényleges `notify_at` alapján
- [ ] Megtakarítás kártya valódi összeggel (skip-pelt tételek összege)

### Push értesítések (Fázis 3B)
- [ ] `expo-notifications` regisztráció
- [ ] Push token mentése `push_tokens` táblába
- [ ] Edge Function aktiválása: 24h lejárt impulzusoknál értesítés

### AI chat (Fázis 4)
- [ ] `ai-chat.tsx` bekötése a Supabase Edge Function `/ai-chat` SSE streamre
- [ ] Impulzus check: `type: 'impulse_check'` + `context_id: impulse_item_id`
- [ ] Dashboard AI insight: `type: 'spending_analysis'` → havi szokások elemzése

---

## Alkalmazás indítása

```bash
# 1. Függőségek telepítése
cd E:/Nexpense/apps/mobile
npm install

# 2. .env fájl (már megvan, nem kell újra)
# EXPO_PUBLIC_SUPABASE_URL=https://...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 3. Indítás
npx expo start

# Expo Go 54.0.2 → QR kód beolvasás
```

> **Fontos:** Mindig az `apps/mobile` mappából indítsd, nem a gyökérből!

---

## Git história

| Commit | Leírás |
|--------|--------|
| `8736901` | fix: 7 bejelentett bug (auth race, dátum timezone, modal keyboard, tab ikonok) |
| `f874cc0` | feat(phase2): beállítások + kimutatások valódi Supabase adatokkal |
| `06f48ff` | feat(expenses): valódi Supabase lista swipe-to-delete-tel |
| `f31d0b6` | fix(onboarding): kijelölés állapot, Tovább gomb, közvetlen belépés |
| `581e4bb` | feat: Fázis 2 – valódi Supabase auth és kiadás CRUD |
| `6a885c4` | fix: Expo SDK 54-re állítás (Expo Go 54.0.2 kompatibilis) |
| `4ca2c09` | fix: Windows Expo indítási hibák javítása |
| `f22dc06` | docs: projekt státusz dokumentáció |
| `81a8f99` | fix: Expo induláskori crash és config hibák |
| `2221af1` | feat: teljes mobile app scaffold |
| `d34299a` | first commit |
