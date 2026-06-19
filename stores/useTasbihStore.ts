/**
 * Tasbih (dhikr counter) store
 *
 * Customizable dhikr counter, persisted to MMKV. Two modes:
 *  - 'postSalah': auto-cycles SubhanAllah 33 → Alhamdulillah 33 → Allahu Akbar 34
 *  - 'single':    one chosen dhikr (from the library or a custom one) counted to
 *                 a chosen target (33 / 99 / 100 / free), looping on completion.
 * Tracks a daily total (reset at date change) + lifetime total for the Progress tab.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';
import { defaultStorage } from '../api/client/storage';
import { createLogger } from '../services/logging/logger';

const logger = createLogger('Tasbih Store');

export interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export interface TasbihStep {
  dhikr: Dhikr;
  target: number; // 0 = free (no target, never auto-advances)
}

export const CUSTOM_DHIKR_ID = 'custom';

// Common adhkar people count. Arabic + transliteration + meaning.
export const ADHKAR_LIBRARY: Dhikr[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللّٰه', transliteration: 'SubhanAllah', meaning: 'Glory be to Allah' },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلّٰه', transliteration: 'Alhamdulillah', meaning: 'All praise is for Allah' },
  { id: 'allahuakbar', arabic: 'اللّٰهُ أَكْبَر', transliteration: 'Allahu Akbar', meaning: 'Allah is the Greatest' },
  { id: 'tahlil', arabic: 'لَا إِلٰهَ إِلَّا الله', transliteration: 'La ilaha illallah', meaning: 'There is no god but Allah' },
  { id: 'istighfar', arabic: 'أَسْتَغْفِرُ الله', transliteration: 'Astaghfirullah', meaning: 'I seek forgiveness from Allah' },
  { id: 'hawqala', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِالله', transliteration: 'La hawla wa la quwwata illa billah', meaning: 'There is no power except with Allah' },
  { id: 'salawat', arabic: 'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّد', transliteration: 'Allahumma salli ʿala Muhammad', meaning: 'O Allah, send blessings upon Muhammad' },
  { id: 'subhana_bihamdihi', arabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ', transliteration: 'SubhanAllahi wa bihamdihi', meaning: 'Glory and praise to Allah' },
  { id: 'hasbunallah', arabic: 'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيل', transliteration: 'Hasbunallahu wa niʿmal wakil', meaning: 'Allah is sufficient for us' },
];

export const TARGET_PRESETS = [33, 99, 100, 0] as const; // 0 = free

// Classic post-salah tasbih (33 / 33 / 34 = 100).
const POST_SALAH_STEPS: { id: string; target: number }[] = [
  { id: 'subhanallah', target: 33 },
  { id: 'alhamdulillah', target: 33 },
  { id: 'allahuakbar', target: 34 },
];

const libraryById = (id: string): Dhikr =>
  ADHKAR_LIBRARY.find((d) => d.id === id) ?? ADHKAR_LIBRARY[0];

const todayStr = (): string => format(new Date(), 'yyyy-MM-dd');

export type TasbihMode = 'postSalah' | 'single';

interface TasbihState {
  // config
  mode: TasbihMode;
  singleId: string;          // library id or CUSTOM_DHIKR_ID
  singleTarget: number;      // 0 = free
  custom: Dhikr | null;      // user-defined dhikr

  // runtime
  count: number;
  stepIndex: number;
  rounds: number;
  todayTotal: number;
  lifetimeTotal: number;
  lastDate: string;

  // actions
  increment: () => void;
  resetCycle: () => void;
  setMode: (mode: TasbihMode) => void;
  setSingleDhikr: (id: string) => void;
  setSingleTarget: (target: number) => void;
  setCustomDhikr: (dhikr: Omit<Dhikr, 'id'>) => void;
}

/** Resolve the ordered steps for the current config (pure). */
export function computeSteps(
  state: Pick<TasbihState, 'mode' | 'singleId' | 'singleTarget' | 'custom'>
): TasbihStep[] {
  if (state.mode === 'postSalah') {
    return POST_SALAH_STEPS.map((s) => ({ dhikr: libraryById(s.id), target: s.target }));
  }
  const dhikr =
    state.singleId === CUSTOM_DHIKR_ID && state.custom
      ? state.custom
      : libraryById(state.singleId);
  return [{ dhikr, target: state.singleTarget }];
}

/** The active step (dhikr + target) for the current runtime position. */
export function activeStepOf(state: TasbihState): TasbihStep {
  const steps = computeSteps(state);
  return steps[Math.min(state.stepIndex, steps.length - 1)] ?? steps[0];
}

export const useTasbihStore = create<TasbihState>()(
  persist(
    (set) => ({
      mode: 'postSalah',
      singleId: 'subhanallah',
      singleTarget: 33,
      custom: null,

      count: 0,
      stepIndex: 0,
      rounds: 0,
      todayTotal: 0,
      lifetimeTotal: 0,
      lastDate: todayStr(),

      increment: () =>
        set((s) => {
          const today = todayStr();
          const rolledOver = s.lastDate !== today;
          const base = {
            todayTotal: (rolledOver ? 0 : s.todayTotal) + 1,
            lifetimeTotal: s.lifetimeTotal + 1,
            lastDate: today,
          };

          const steps = computeSteps(s);
          const idx = Math.min(s.stepIndex, steps.length - 1);
          const target = steps[idx].target;

          // Free target (0): keep counting up, never advance.
          if (target <= 0) {
            return { ...base, count: s.count + 1 };
          }

          // Completed the current step → next tap starts the next step (so the
          // user dwells on the target count before it advances).
          if (s.count >= target) {
            const nextIndex = (idx + 1) % steps.length;
            return {
              ...base,
              count: 1,
              stepIndex: nextIndex,
              rounds: nextIndex === 0 ? s.rounds + 1 : s.rounds,
            };
          }

          return { ...base, count: s.count + 1 };
        }),

      resetCycle: () => {
        logger.debug('Tasbih cycle reset');
        set({ count: 0, stepIndex: 0 });
      },

      // Changing config restarts the count so the new dhikr/target begins cleanly.
      setMode: (mode) => set({ mode, count: 0, stepIndex: 0 }),
      setSingleDhikr: (singleId) => set({ mode: 'single', singleId, count: 0, stepIndex: 0 }),
      setSingleTarget: (singleTarget) => set({ singleTarget, count: 0, stepIndex: 0 }),
      setCustomDhikr: (dhikr) =>
        set({
          custom: { ...dhikr, id: CUSTOM_DHIKR_ID },
          singleId: CUSTOM_DHIKR_ID,
          mode: 'single',
          count: 0,
          stepIndex: 0,
        }),
    }),
    {
      name: 'tasbih-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => defaultStorage.getString(name) ?? null,
        setItem: (name, value) => defaultStorage.setString(name, value),
        removeItem: (name) => defaultStorage.delete(name),
      })),
      version: 2,
      migrate: (persisted: any, version) => {
        // v1 had a fixed post-salah cycle (dhikrIndex) and no config fields.
        if (version < 2 && persisted) {
          return {
            ...persisted,
            mode: 'postSalah',
            singleId: 'subhanallah',
            singleTarget: 33,
            custom: null,
            stepIndex: persisted.dhikrIndex ?? 0,
          };
        }
        return persisted;
      },
    }
  )
);

// Selector: today's dhikr count (for the Progress tab card).
export const useTasbihToday = (): number =>
  useTasbihStore((s) => (s.lastDate === todayStr() ? s.todayTotal : 0));
