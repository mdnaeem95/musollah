# CLAUDE.md — Rihlah (Musollah)

Guidance for Claude Code when working in this repository. Read this before making changes.

## What this app is

**Rihlah** (package name `rihlah`, also referred to as "Musollah") is an offline-first **Islamic companion app** for Singapore Muslims, built with React Native + Expo. It bundles the daily-practice tools a Muslim needs into one app:

- **Prayer** — prayer times (MUIS Singapore + Aladhan), Qibla compass, monthly times, Friday khutbah, du'as, prayer logging & streaks.
- **Quran** — surah reader/player, bookmarks, du'as, a Khatam recitation planner.
- **Musollah** — map-based finder for musollahs (prayer spaces), mosques, and bidets; community add/report.
- **Food** — halal restaurant finder with **aggregated Google ratings** (no user reviews — see Gotchas), favorites, and a food-additives (E-number) checker.
- **Settings** — themes, adhan selection, zakat/fidyah calculators, referral leaderboard, account.

Target market is Singapore (defaults to Singapore coordinates, MUIS prayer authority). Monetized via AdMob banner ads.

## Tech stack

- **React Native 0.81.5**, **Expo 54** (`app.config.js`, dev-client builds), **Expo Router 6** (file-based routing), React 19.1.
- **State**: Zustand + `react-native-mmkv` for client/offline state; **TanStack Query v5** for server state; **Firebase** (`@react-native-firebase/*`) as the backend/sync layer (Firestore, Auth, Storage, Analytics, Crashlytics).
- **Backend**: Firebase **Cloud Functions** in `functions/` (Node 24, scrapers for MUIS prayer times / Google Places / social media; see below).
- **UI**: fully custom components (no component library) + **Moti** (primary animation), Reanimated 4, Lottie, `@gorhom/bottom-sheet`, `react-native-maps`, `expo-blur`.
- **Native add-ons**: iOS home-screen **widget** (`targets/widget/`, SwiftUI via `@bacons/apple-targets`), `react-native-track-player` (Quran audio), `expo-notifications` (prayer reminders/adhan).
- **Error/observability**: Sentry + Firebase Crashlytics.

## Commands

```bash
npm start              # expo start --dev-client (Metro)
npm run ios            # expo run:ios  (native build; uses static frameworks)
npm run android        # expo run:android
# postinstall runs patch-package automatically (patches/ has 2 patches)
```

EAS build channels: `development`, `development-simulator`, `preview`, `production` (`eas.json`). iOS deployment target 15.6, static frameworks, `buildReactNativeFromSource`.

Cloud Functions (in `functions/`): `npm run build`, `npm run serve` (emulator), `npm run deploy`, `npm run lint`.

> There is **no test suite, ESLint, or Prettier config** in the app project. Don't assume `npm test`/`npm run lint` exist at the root. TypeScript is `strict: true` — rely on `tsc` for safety. If you add tooling, say so explicitly.

## Architecture & conventions

### Routing (Expo Router) — `app/`
- Provider order (`app/_layout.tsx`): `QueryClientProvider` → `ActionSheetProvider` → `AuthProvider` → `ThemeProvider` → `NotificationProvider` → `AppShell`. `app/_app-shell.tsx` hosts the root `<Stack headerShown:false>`, a `ModernSplash` held until `useAppInitialization` is ready, and a global `<Toast>`.
- Tabs live in `app/(tabs)/` as route groups: `(prayer)` (initial/default), `(quran)`, `(musollah)`, `(food)`, `(settings)`. Each group has its own nested `_layout.tsx` `Stack` with a gradient header; the tab bar is icon-only, themed via `theme.colors.tabBar.*`, icons chosen by a `switch` on `route.name` in `app/(tabs)/_layout.tsx`.
- **Entry routing** (`app/index.tsx`): reads `hasSeenOnboarding` from MMKV → redirects to `/(tabs)` or `/onboarding/AssistantOnboardingScreen`.
- **Auth is NOT route-gated.** The whole app is usable logged-out; features that need auth render `components/SignInModal` on demand (`if (!user) setShowSignInModal(true)`). There is no login route.
- **Adding a screen**: create `app/(tabs)/(group)/name/index.tsx`, register `<Stack.Screen name="name/index" />` in the group `_layout.tsx`. Dynamic routes `[id].tsx`. Full-screen flows use `presentation: 'fullScreenModal'`. To keep a route off the tab bar use `options={{ href: null }}`.
- **Detail panels** (e.g. `(musollah)/*Sheet.tsx`) are **plain components, not routes** — `@gorhom/bottom-sheet` + blur + Moti, imported into the group `index.tsx`.

### State
- **Zustand stores** in `stores/`: `useAuthStore`, `usePreferencesStore` (`userPreferencesStore.ts`), `useDoaBookmarksStore`, `useLocationStore`, `useQuranStore`, `useRecentSearchesStore`. Pattern: `create<State>()(persist((set,get)=>({...}), { name, storage: createJSONStorage(() => …), partialize?, version?, migrate? }))` backed by `defaultStorage` from `api/client/storage`. Export granular selector hooks (`use<Entity><Property>`), use `useShallow` for multi-field selectors. Add a `createLogger('Xxx Store')` at the top.
- **TanStack Query** in `api/`:
  - `api/client/` — `firebase.ts` (Firestore/Auth/Storage/Analytics/Crashlytics + `getCollection`/`getDocument`/`createBatch` helpers), `storage.ts` (three MMKV instances + `StorageService`/`CacheService` + `TTL`), `http.ts`.
  - **Always wrap Firestore calls** with `api/services/utils/query-wrapper.ts` (`safeFirestoreGet`/`safeFirestoreListener`/`safeFirestoreWrite`/...) — they sanitize data, preserve FieldValues, and time out at 10s. Don't call raw `.get()`/`.set()` in services.
  - **Two service shapes coexist.** The **target/ideal** is the structured split used by `api/services/prayer/`: `types/` (Zod schemas + inferred types), `api/` (raw sources + `transformers.ts`), `queries/` (hooks + `query-keys.ts`), `utils/`, barrel `index.ts`. All other services (`food`, `quran`, `musollah`, `duas`, `gold`, `khutbah`, `user`, …) are still **flat** single-`index.ts` files. When adding a new service or substantially reworking one, prefer the structured `prayer/` shape.
  - Query keys: hierarchical factory objects (see `prayer/queries/query-keys.ts`). Use the cancel→snapshot→rollback pattern for optimistic mutations.
- **Redux is dead.** `@reduxjs/toolkit`/`redux-persist`/`react-redux` remain in `package.json` but have **zero usage** — migration to Zustand is complete. Don't write new Redux; these deps can be removed.

### Theming — `theme/theme.ts` + `context/ThemeContext.tsx`
- **Always** `import { useTheme } from 'context/ThemeContext'` → `const { theme } = useTheme()`. (Note: `userPreferencesStore` also exports a `useTheme`/`useThemeColors` — **do not use those for styling**.)
- Three schemes (`green`/`blue`/`purple`) × light/dark. Styling pattern: module-level `const createStyles = (theme) => StyleSheet.create({...})`, called in-component after `useTheme()`.
- **Color tokens** (under `theme.colors`): `primary` = page background (NOT an accent — it's invisible as a button), `secondary` = cards/surfaces, `accent` = highlights/buttons/active, `muted` = separators/borders. `text.{primary,secondary,muted,success,error,arabic}`. Also `modalBackground`, `tabBar.*`, `fab.*`. **There is NO `colors.background`, `colors.surface`, or `colors.border`** — use `primary`/`secondary`/`muted`.
- **Living-sky accent (the app's signature identity).** The highlight **accent** is sky-phase-driven by default — it shifts with the real time of day (dawn → sunrise → midday → golden-hour → sunset → night), tied to the MUIS prayer times. Engine: `hooks/prayer/useSkyPhase.ts` (current phase + per-phase accent) feeding `hooks/useAccent.ts` (`useAccent()` → `{ accent, label, isSky }`). Toggled by the `useSkyAccent` preference (default **on**; Settings → Appearance → "Living Sky"). **For accent/active/selected/emphasis UI, prefer `useAccent()` over `theme.colors.accent`** so it tracks the sky. The green/blue/purple theme still governs surfaces/text and is the accent *fallback* when the toggle is off. Already wired through the tab bar, every group header (`components/AccentHeaderBackground.tsx` — a thin accent hairline), the prayer home (`components/prayer/NextPrayerHero.tsx` + `SkyBackground.tsx`, the procedural animated sky), and the whole food tab. Keep extending it to new surfaces.
- Non-color tokens: `theme.fontSizes`, `theme.spacing` (small 8 / medium 16 / large 24), `theme.borderRadius`, `...theme.shadows.default`. Never hardcode colors/spacing — pull from tokens.
- **Fonts** are referenced as raw string literals: `Outfit_400Regular` (default), `_300Light/_500Medium/_600SemiBold/_700Bold`, and `Amiri_400Regular` for Arabic.
- Build UI from custom components + RN primitives. `react-native-paper` and `react-native-purchases` (RevenueCat) are installed but **unused** — there is no premium/paywall.

### Logging — MANDATORY (`services/logging/logger.ts`)
- `import { createLogger } from 'services/logging/logger'` → `const logger = createLogger('Category')` → `logger.debug/info/success/warn/error(msg, error?, metadata?)`.
- **No emoji** in messages. **No raw `console.*`**.
- **NEVER call `logger` inside a Reanimated worklet** (`withTiming`/`withSpring`/etc.) — it's a JS-thread host object and will crash. Use `console.log` inside worklets, or hop out via `runOnJS`.

### Imports
Imports are **relative** (`../../../components/...`), not path-aliased. Only 2 files use `@/`. Match the surrounding relative style; don't introduce `@/` aliases ad hoc.

### Other directories
- `hooks/` — page/business-logic hooks composing the query layer (`initialization/useAppInitialization` + `useLazyInit`, `prayer/`, `quran/`, `food/`, `settings/`, `zakat/`, `utils/useHapticFeedback`). Not a replacement for `api/services`.
- `context/` — `ThemeContext`, `AuthContext` (`useAuth` → `{ user }` via Firebase), `NotificationContext`, `MushafPlayingContext`, `PlanContext`.
- `services/` (root) — `logging/`, `analytics/service.ts` (`analyticsService`), `notifications/` (prayer scheduling + push registration).
- `functions/` — Firebase Cloud Functions: scrapers (`muisScraper`, `googlePlacesScraper`, `muisDiscovery`, `socialMediaChecker`), `scrapers/ratingBackfill.ts` (backfills the Google Places `rating` onto restaurant docs — HTTP `backfillRestaurantRatings?dryRun&limit=N` + daily `scheduledRatingBackfill`; name-gated so stalls don't inherit a food court's rating), and `updateManager.ts`. Separate `package.json`/tsconfig; has its own ESLint. **Deploy with `npx firebase-tools deploy …`** — the standalone `firebase` binary's bundled npm crashes the predeploy hook (`Cannot read properties of undefined (reading 'stdin')`).
- `targets/widget/` — iOS SwiftUI prayer-times widget; JS↔native bridge in `utils/widgetBridge.ts` via shared app group `group.com.rihlah.prayerTimesWidget`.
- `patches/` — `patch-package` patches for `react-native-modal` and `react-native-track-player`. Re-run via `postinstall`.

## Gotchas
- Two `user` sources coexist: `context/AuthContext` (`useAuth`) and `stores/useAuthStore`. Know which a screen uses before changing auth logic.
- The **Ramadan feature was removed** (deleted in git). Project memory still mentions Ramadan mode — it no longer exists in `app/` or `api/services/`. Ignore stale Ramadan references.
- iOS uses static frameworks + `buildReactNativeFromSource` — native builds are slow; prefer `npm start` against an existing dev-client when possible.
- Firestore is configured with persistence/offline cache; the QueryClient is `networkMode: 'offlineFirst'` (staleTime 5m, gcTime 24h). Design features to work offline-first.
- **Prayer times** live in per-year Firestore collections `prayerTimes{year}` (doc shape `{ date: "D/M/YYYY", time: { subuh, syuruk, zohor, asar, maghrib, isyak } }`, 24h `HH:MM`). They must come from the **official MUIS Singapore timetable**, not a calculation library (Aladhan is only an on-device fallback). Seed/repair them with the validated pipeline in [scripts/prayer-times/](scripts/prayer-times/) — never hand-edit times in Firestore. Always resolve the collection name via `getPrayerTimesCollection(year)`; never hardcode a year. The iOS widget reads prayer data from the app-group key `prayerTimesData` (legacy `prayerTimes2025` still dual-written — these are storage keys, not collections).
- **Food has no user reviews.** The user-review feature (submit/list screens, the `restaurantReviews` collection + reviews subcollection) was removed — the app shows the **aggregated Google Places `rating`** instead. `restaurant.rating` (number) is the field the cards + detail read; backfill it with `functions/.../ratingBackfill.ts`. `averageRating`/`totalReviews` are legacy and no longer written/displayed.
- **Secrets were leaked** on the public GitHub repo and have been rotated + scrubbed from history — see [SECURITY.md](SECURITY.md). Never commit keys; load service-account/API keys via env / EAS secrets / Firebase secrets, not source. One straggler: the gold-price key in `api/services/gold/index.ts` now reads `process.env.EXPO_PUBLIC_METAL_PRICE_API_KEY` but still ships in the client bundle — the proper fix is a Cloud Function proxy.

## Modernization & differentiation roadmap

The user wants to modernize this app and differentiate it from other Islamic apps. This is a prioritized roadmap — a living document, not a contract. Confirm scope with the user before building anything sizeable; they own the roadmap.

### Strategic thesis
Most Islamic apps (Muslim Pro, Athan, Pillars, Quran.com) are **generic, global, online-dependent, and ad-bloated**. Rihlah's edge is the opposite: **hyper-local to Singapore, authoritative (MUIS), offline-first, and community-powered**. Don't try to out-feature the global apps on Quran/prayer basics — win on local depth, data nobody else has (the musollah/bidet/halal map), and a calmer, more polished experience. Every new feature should pass one test: *does this make Rihlah more indispensable to a Muslim in Singapore specifically, or is it a generic feature any app has?*

### Foundation first (do before/alongside new features)
These are cheap, unblock everything else, and reduce risk. Knock them out early.
1. **Remove dead weight** — drop Redux (`@reduxjs/toolkit`, `redux-persist`, `react-redux`) and `react-native-paper` from `package.json`; they're unused. Smaller bundle, less confusion.
2. **Decide the auth-source duplication** — collapse `context/AuthContext` and `stores/useAuthStore` into one. Pick the store as the single source of truth; this blocks any reliable account/social/premium work.
3. **Finish the service-layer migration incrementally** — every time you touch a flat `api/services/*` service, migrate it to the structured `prayer/` shape (Zod types + `queries/` + `query-keys.ts`). Don't do a big-bang rewrite.
4. **Add a minimal safety net** — there are zero tests and no lint. Add ESLint + a typecheck CI gate and a handful of unit tests around the riskiest pure logic (prayer-time calc, qibla, zakat). This is what lets you move fast later without regressions.

### Tier 1 — Differentiators (highest leverage, build these)
These deepen the moat. Roughly ordered by impact-to-effort.
- **Own the community map.** The musollah/mosque/bidet map is the single most unique asset — no global app has Singapore prayer-space data at this granularity. Invest here: photos, crowd/cleanliness ratings, "open now"/access notes, wudu/gender facilities, accessibility, verified-by-MUIS badges, and a fast moderation path for the existing community reports. Make it the reason people open the app daily. (Code lives in `app/(tabs)/(musollah)/` + `api/services/musollah/`.)
- **Best-in-class prayer widgets + Live Activities.** The iOS widget (`targets/widget/`) already exists — extend to a Lock Screen / Dynamic Island **Live Activity** counting down to the next prayer/iqamah, and ship an Android equivalent. Glanceable next-prayer info is the #1 reason people keep a prayer app installed; doing it better than competitors is concrete and high-retention.
- **Cohere the habit loop.** Streaks, Khatam planner, and the referral leaderboard exist but are scattered. Unify them into one "spiritual progress" surface (prayer consistency, Quran progress, fasting later) with gentle, non-gamified-to-the-point-of-guilt nudges. The differentiator is *tasteful* — calm, not Duolingo-aggressive.
- **"Ahmad" AI assistant.** The mascot already exists in onboarding. A genuinely useful, Singapore-context-aware Islamic Q&A / guidance assistant (prayer rulings framed as "consult a scholar", finding the nearest musollah, halal questions, additive lookups) would be a standout feature few local apps have. **Build on Claude** — see `claude-api` skill for current model IDs/pricing; route through a Cloud Function, never embed keys client-side. Scope carefully around religious-ruling liability (cite sources, defer to MUIS/asatizah).

### Tier 2 — Modernization & polish
- **Design refresh pass** — ✅ **Shipped: the living-sky accent system** (time-of-day accent app-wide, the prayer-home `NextPrayerHero` + demoted clock, per-tab header accent hairline) and a food-tab polish pass (Google-rating card badge, hero scrim). Remaining: continue per-surface visual polish (restaurant cards/detail, prayer list rhythm), subtle haptics/transitions. The system is strong (Moti, blur, gradients, skeletons).
- **Notifications that respect the user** — smarter adhan/reminder scheduling, pre-prayer "get ready" nudges, and Do-Not-Disturb awareness. Notifications are where prayer apps either delight or get uninstalled.
- **Deepen the halal/additives angle** — barcode scanning for additives/E-numbers, restaurant halal-certification status (MUIS cert lookup via the existing scrapers in `functions/`), and user-contributed halal reports. Another Singapore-specific data moat.
- **Performance & startup** — measure cold-start (the `useAppInitialization` blocking boot), trim what can move to `useLazyInit`, and keep FlashList usage tight on long lists (Quran, restaurants).

### Tier 3 — Monetization (only after retention is proven)
- **Wire up RevenueCat** (`react-native-purchases` is already a dependency, currently unused). A **"Rihlah Plus"** tier could offer: ad-free, premium reciters/audio, advanced Khatam/habit analytics, richer widgets/Live Activities, and priority AI-assistant usage. Keep all *core worship* features free forever — only paywall convenience/premium polish. This both diversifies revenue away from AdMob and aligns incentives (less reliance on ads = calmer UX, which is itself a differentiator).

### Anti-goals (what NOT to do)
- Don't bolt on generic features just because competitors have them (Tasbih counters, generic Islamic-quote feeds, qibla-only clones) unless they serve the local/community thesis.
- Don't compromise offline-first or load the UI with more ads.
- Don't ship religious rulings as authoritative — always defer to MUIS/qualified scholars and cite sources, especially in any AI feature.
