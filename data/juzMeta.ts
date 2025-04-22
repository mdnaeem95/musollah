// src/data/juzMeta.ts

export interface JuzMeta {
    number: number;
    start: { surah: number; ayah: number };
    end: { surah: number; ayah: number };
  }
  
  export const juzMeta: JuzMeta[] = [
    { number: 1, start: { surah: 1, ayah: 1 }, end: { surah: 2, ayah: 141 } },
    { number: 2, start: { surah: 2, ayah: 142 }, end: { surah: 2, ayah: 252 } },
    { number: 3, start: { surah: 2, ayah: 253 }, end: { surah: 3, ayah: 92 } },
    { number: 4, start: { surah: 3, ayah: 93 }, end: { surah: 4, ayah: 23 } },
    { number: 5, start: { surah: 4, ayah: 24 }, end: { surah: 4, ayah: 147 } },
    { number: 6, start: { surah: 4, ayah: 148 }, end: { surah: 5, ayah: 81 } },
    { number: 7, start: { surah: 5, ayah: 82 }, end: { surah: 6, ayah: 110 } },
    { number: 8, start: { surah: 6, ayah: 111 }, end: { surah: 7, ayah: 87 } },
    { number: 9, start: { surah: 7, ayah: 88 }, end: { surah: 8, ayah: 40 } },
    { number: 10, start: { surah: 8, ayah: 41 }, end: { surah: 9, ayah: 92 } },
    { number: 11, start: { surah: 9, ayah: 93 }, end: { surah: 11, ayah: 5 } },
    { number: 12, start: { surah: 11, ayah: 6 }, end: { surah: 12, ayah: 52 } },
    { number: 13, start: { surah: 12, ayah: 53 }, end: { surah: 14, ayah: 52 } },
    { number: 14, start: { surah: 15, ayah: 1 }, end: { surah: 16, ayah: 128 } },
    { number: 15, start: { surah: 17, ayah: 1 }, end: { surah: 18, ayah: 74 } },
    { number: 16, start: { surah: 18, ayah: 75 }, end: { surah: 20, ayah: 135 } },
    { number: 17, start: { surah: 21, ayah: 1 }, end: { surah: 22, ayah: 78 } },
    { number: 18, start: { surah: 23, ayah: 1 }, end: { surah: 25, ayah: 20 } },
    { number: 19, start: { surah: 25, ayah: 21 }, end: { surah: 27, ayah: 55 } },
    { number: 20, start: { surah: 27, ayah: 56 }, end: { surah: 29, ayah: 45 } },
    { number: 21, start: { surah: 29, ayah: 46 }, end: { surah: 33, ayah: 30 } },
    { number: 22, start: { surah: 33, ayah: 31 }, end: { surah: 36, ayah: 27 } },
    { number: 23, start: { surah: 36, ayah: 28 }, end: { surah: 39, ayah: 31 } },
    { number: 24, start: { surah: 39, ayah: 32 }, end: { surah: 41, ayah: 46 } },
    { number: 25, start: { surah: 41, ayah: 47 }, end: { surah: 45, ayah: 37 } },
    { number: 26, start: { surah: 46, ayah: 1 }, end: { surah: 51, ayah: 30 } },
    { number: 27, start: { surah: 51, ayah: 31 }, end: { surah: 57, ayah: 29 } },
    { number: 28, start: { surah: 58, ayah: 1 }, end: { surah: 66, ayah: 12 } },
    { number: 29, start: { surah: 67, ayah: 1 }, end: { surah: 77, ayah: 50 } },
    { number: 30, start: { surah: 78, ayah: 1 }, end: { surah: 114, ayah: 6 } },
  ];  