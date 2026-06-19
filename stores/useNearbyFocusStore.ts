/**
 * Nearby Focus Store
 *
 * Ephemeral (non-persisted) hand-off used by the unified search modal to tell
 * the Nearby screen which facility to reveal after the modal closes. Facilities
 * (musollah / mosque / bidet) are bottom sheets on the map rather than routes,
 * so we can't navigate straight to them — the Nearby screen reacts to this
 * focus, switches to the right layer, and opens the sheet.
 *
 * Food results navigate to their detail route directly and don't use this.
 */

import { create } from 'zustand';

export type NearbyFocusKind = 'musollah' | 'mosque' | 'bidet';

export interface NearbyFocus {
  kind: NearbyFocusKind;
  id: string;
}

interface NearbyFocusState {
  focus: NearbyFocus | null;
  setFocus: (focus: NearbyFocus) => void;
  clearFocus: () => void;
}

export const useNearbyFocusStore = create<NearbyFocusState>((set) => ({
  focus: null,
  setFocus: (focus) => set({ focus }),
  clearFocus: () => set({ focus: null }),
}));
