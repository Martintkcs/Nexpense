# Nexpense – Fejlesztési Állapot

_Utolsó frissítés: 2026-02-28_

---

## Mi készült el

### Prototípus
- **`prototype/index.html`** — Önálló interaktív HTML prototípus (Google Fonts kivételével nincs külső függőség)
  - Mind az 5 fő képernyő: Dashboard, Kiadások, Analytics, Impulzus, Beállítások
  - Gyors hozzáadás modal számbillentyűzettel
  - AI Chat modal streaming szimulációval
  - Dark mode kapcsoló, valós óra, bottom tab navigáció

### Monorepo struktúra
```
E:/Nexpense/
├── apps/mobile/          ← React Native Expo alkalmazás
├── supabase/             ← Adatbázis migrációk + Edge Functions
├── prototype/            ← HTML prototípus
├── docs/                 ← Ez a fájl
├── package.json          ← pnpm workspace gyökér
└── pnpm-workspace.yaml
```

### Mobile app (`apps/mobile/`)

#### Navigáció (Expo Router, file-based)
| Útvonal | Leírás |
|---------|--------|
| `app/(auth)/welcome.tsx` | Nyitóképernyő logóval és CTA gombokkal |
| `app/(auth)/login.tsx` | Bejelentkezési form |
| `app/(auth)/register.tsx` | Regisztrációs form |
| `app/(auth)/onboarding/[step].tsx` | 10 lépéses onboarding (dinamikus) |
| `app/(tabs)/index.tsx` | Dashboard – havi összesítő, AI insight, FAB |
| `app/(tabs)/expenses/index.tsx` | Kiadáslista keresővel és szűrőkkel |
| `app/(tabs)/analytics/index.tsx` | Kimutatások – időszak választó, kategória lista |
| `app/(tabs)/impulse/index.tsx` | Impulzus tételek listája visszaszámlálóval |
| `app/(tabs)/impulse/new.tsx` | Új impulzus tétel hozzáadása |
| `app/(tabs)/settings/index.tsx` | Beállítások – profil, kapcsolók |
| `app/modals/quick-add.tsx` | Gyors kiadás rögzítés számgombokkal |
| `app/modals/apple-pay-detected.tsx` | Apple Pay észlelés popup |
| `app/modals/ai-chat.tsx` | Teljes képernyős AI chat |
| `app/_layout.tsx` | Root layout (GestureHandler, Query, Auth providerek) |

#### State management
| Fájl | Leírás |
|------|--------|
| `src/stores/expenseStore.ts` | Zustand – kiadások, optimistic updates, offline queue |
| `src/stores/settingsStore.ts` | Zustand – deviza, órabér, kapcsolók, dark mode |

#### Szolgáltatások és segédletek
| Fájl | Leírás |
|------|--------|
| `src/services/supabase/client.ts` | Singleton Supabase kliens AsyncStorage session-nel |
| `src/providers/AuthProvider.tsx` | Supabase auth session listener + `useAuth()` hook |
| `src/providers/QueryProvider.tsx` | TanStack Query v5 (staleTime: 5 perc, retry: 2) |
| `src/types/database.ts` | TypeScript típusok minden táblához és RPC függvényhez |
| `src/lib/constants.ts` | Színek, 14 rendszerkategória, alapértelmezett deviza |
| `src/lib/currency.ts` | `formatCurrency()`, `calcWorkHours()`, `shortenAmount()` |

#### Konfiguráció
| Fájl | Leírás |
|------|--------|
| `app.config.ts` | Expo konfig – scheme, bundle ID, pluginek, EAS |
| `babel.config.js` | NativeWind v4 preset + reanimated plugin |
| `tailwind.config.js` | Design tokenek: elsődleges szín, kategória színek |
| `tsconfig.json` | Strict mód + `@/*` → `./src/*` path alias |

### Supabase (`supabase/`)

#### Adatbázis migrációk
| Fájl | Tartalom |
|------|----------|
| `migrations/0001_initial_schema.sql` | Összes tábla, indexek, triggerek |
| `migrations/0002_rls_policies.sql` | Row Level Security minden táblán |
| `migrations/0003_rpc_functions.sql` | 4 PostgreSQL analitika függvény |
| `migrations/0004_seed_categories.sql` | 14 rendszerkategória (HUF alapon) |

**Táblák:** `profiles`, `categories`, `tags`, `expenses`, `expense_tags`,
`impulse_items`, `ai_conversations`, `ai_messages`, `onboarding_responses`,
`location_rules`, `push_tokens`

#### Edge Functions (Deno)
| Függvény | Leírás |
|----------|--------|
| `functions/ai-chat/` | Claude API proxy SSE streaminggel – 3 üzemmód: impulse_check, spending_analysis, general |
| `functions/scheduled-impulse-check/` | Cron: 24h lejárt impulzus tételeknél Expo Push értesítés |

---

## Tech Stack

| Réteg | Technológia |
|-------|-------------|
| Mobilalkalmazás | React Native + Expo SDK 55 (Managed Workflow) |
| Routing | Expo Router (file-based, groups) |
| UI | NativeWind v4 (Tailwind) + lucide-react-native ikonok |
| State | Zustand v5 + persist middleware (AsyncStorage) |
| Server state | TanStack Query v5 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI | Anthropic Claude (Sonnet – elemzés, Haiku – impulzus) |
| Chartek | Victory Native + react-native-svg |
| Validáció | Zod |
| Dátum | date-fns |
| Animáció | react-native-reanimated v4 |

---

## Mi nincs meg még (következő lépések)

### Azonnal szükséges az első futtatáshoz
- [ ] `.env` fájl létrehozása a tényleges Supabase URL-lel és anon key-jel:
  ```bash
  cp apps/mobile/.env.example apps/mobile/.env
  # → Töltsd ki a Supabase projekt adataival
  ```
- [ ] Supabase migrációk futtatása:
  ```bash
  supabase link --project-ref <PROJEKT_REF>
  supabase db push
  ```

### Fázis 2 – MVP kiadáskezelés (következő sprint)
- [ ] **Supabase auth bekötése** – bejelentkezés / regisztráció (`AuthProvider.tsx` jelenleg ki van kommentezve)
- [ ] **Kiadás CRUD** – `expenseStore.syncPending()` valódi Supabase hívásokkal
- [ ] **Kategória picker komponens** – `src/components/expenses/CategoryPicker.tsx`
- [ ] **Kiadás részlet / szerkesztés** – `app/(tabs)/expenses/[id].tsx`
- [ ] **Impulzus tétel mentés** – `impulse/new.tsx` jelenleg csak UI, nincs store hívás

### Fázis 3 – AI integráció
- [ ] **Valódi AI chat** – `app/modals/ai-chat.tsx` jelenleg `setTimeout` mock, át kell kötni a Supabase Edge Function SSE streamre
- [ ] **Dashboard AI insight kártya** – valódi `spending_analysis` Edge Function hívás

### Fázis 4 – Natív funkciók
- [ ] **Push értesítések** – `expo-notifications` regisztráció, token mentése Supabase-be
- [ ] **Helymeghatározás** – `expo-location` + kategória javaslat
- [ ] **Apple Pay detektálás** – custom Expo config plugin

### Kisebb hiányosságok
- [ ] Chart komponensek (`src/components/charts/`) – Victory Native alapon
- [ ] Dark mode – `useColorScheme()` hook + NativeWind `dark:` osztályok bekötése
- [ ] Hibakezelés és loading státuszok minden képernyőn
- [ ] `tsconfig.json` path alias (`@/*`) nem működik Expo Routerrel alapból → `babel-plugin-module-resolver` szükséges

---

## Alkalmazás indítása

```bash
# 1. Függőségek (ha még nem fut)
cd apps/mobile && npm install

# 2. .env fájl
cp .env.example .env   # és töltsd ki

# 3. Indítás
npx expo start

# Expo Go alkalmazással szkeneld be a QR kódot iPhone-on
```

**Fontos:** Mindig az `apps/mobile` mappából indítsd az Expo-t, nem a gyökérből!

---

## Git história

| Commit | Leírás |
|--------|--------|
| `d34299a` | first commit – projektváz, Supabase migrációk, prototípus |
| `2221af1` | feat: teljes mobile app scaffold (összes képernyő, store-ok, config) |
| `81a8f99` | fix: Expo indítási hiba javítása, asset útvonalak, impulse/new.tsx |
