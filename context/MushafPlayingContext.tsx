import { createContext, useContext } from 'react';

interface MushafPlayingState {
  surahNum: number; // currently loaded surah
  ayahNum: number;  // 1-based; 0 = nothing active
}

const MushafPlayingContext = createContext<MushafPlayingState>({ surahNum: 0, ayahNum: 0 });

export const MushafPlayingProvider = MushafPlayingContext.Provider;

export function useMushafPlaying() {
  return useContext(MushafPlayingContext);
}
