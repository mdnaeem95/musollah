// utils/dateKey.ts
import { format } from 'date-fns';
// If you want strict SGT regardless of device tz, install date-fns-tz and uncomment below:
// import { utcToZonedTime } from 'date-fns-tz';

export const DATE_FMT_DB = 'dd/MM/yyyy'; // Firebase format
// const SGT = 'Asia/Singapore';

export function todayKeySGT(): string {
  // Strict SGT version (uncomment if using date-fns-tz):
  // const zoned = utcToZonedTime(new Date(), SGT);
  // return format(zoned, DATE_FMT_DB);

  // Device-local fallback (works if device is in SGT):
  return format(new Date(), DATE_FMT_DB);
}

/** If you ever need to normalize arbitrary dates to the Firebase key */
export function toDbDateKey(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  // Strict SGT version:
  // const zoned = utcToZonedTime(d, SGT);
  // return format(zoned, DATE_FMT_DB);

  return format(d, DATE_FMT_DB);
}
