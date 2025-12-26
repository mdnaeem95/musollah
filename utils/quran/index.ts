import { JuzMeta } from "../../data/juzMeta";
import { surahMeta } from "../../data/surahMeta"

export const calculateTotalAyahs = (juz: JuzMeta): number => {
  const { start, end } = juz;
  if (start.surah === end.surah) {
    return end.ayah - start.ayah + 1;
  }

  let total = 0;
  for (let surahNum = start.surah; surahNum <= end.surah; surahNum++) {
    const meta = surahMeta.find((s) => s.number === surahNum);
    if (!meta) continue;

    if (surahNum === start.surah) {
      total += meta.ayahCount - start.ayah + 1;
    } else if (surahNum === end.surah) {
      total += end.ayah;
    } else {
      total += meta.ayahCount;
    }
  }
  return total;
};

export const countReadAyahsInJuz = (
  juz: JuzMeta,
  readKeys: string[]
): number => {
  const { start, end } = juz;

  const inRange = (surah: number, ayah: number) => {
    if (surah < start.surah || surah > end.surah) return false;
    if (surah === start.surah && ayah < start.ayah) return false;
    if (surah === end.surah && ayah > end.ayah) return false;
    return true;
  };

  return readKeys.reduce((count, key) => {
    const [s, a] = key.split(':').map(Number);
    if (inRange(s, a)) count++;
    return count;
  }, 0);
};
