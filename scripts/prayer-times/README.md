# Prayer-times seeding

The `prayerTimes{YEAR}` Firestore collections power prayer times across the app
(dashboard, monthly table, notifications, iOS widget). They are the **source of
truth** the app reads first (Aladhan is only an on-device fallback).

These collections must come from the **official MUIS Singapore timetable**, not a
calculation library. MUIS times differ from generic calculators (e.g. Aladhan
method 11) by 1–20+ minutes; the 2026 collection was once populated by an
ad-hoc process that drifted badly off MUIS (Asar up to 35 min wrong). This
folder replaces that with a validated, repeatable pipeline.

## Adding a new year

1. Download MUIS's "Prayer Times for Singapore Year `<yyyy>`" PDF.
2. Create `data/<yyyy>.txt`. Paste the table rows — one day per line. The parser
   needs each line to contain `D/M/YYYY` followed by the six prayer times as
   `hour minute` pairs in this fixed order:

   ```
   Subuh  Syuruk  Zohor  Asar  Maghrib  Isyak
   ```

   The MUIS PDF prints a 12-hour clock with no AM/PM; the seeder converts to 24h
   using Singapore's fixed prayer ordering (Subuh/Syuruk = AM; Zohor 12 = noon;
   Asar/Maghrib/Isyak = PM). Day-of-week words and comment lines (`#`) are
   ignored, so you can paste rows like `1/1/2026 Thurs 5 44 7 08 1 10 4 34 7 11 8 25`
   directly. See `data/2026.txt` for the normalized form.

3. Dry run (audits the live collection, writes a backup, writes nothing):

   ```bash
   node scripts/prayer-times/seed-prayer-times.mjs --year=<yyyy>
   ```

4. Apply once the audit looks right:

   ```bash
   node scripts/prayer-times/seed-prayer-times.mjs --year=<yyyy> --apply
   ```

   It backs up, upserts every day (creating missing docs, patching changed
   ones), then re-reads and asserts 100% match.

## Validation (runs before any write)

The seeder **aborts before touching Firestore** if the parsed table fails any of:

- day count ≠ number of days in the year,
- duplicate dates,
- prayers out of order within a day,
- any prayer jumping > 3 minutes day-to-day (catches transcription typos —
  real Singapore times move ~1 min/day).

## Auth

Uses a Firebase Admin service-account JSON (no npm deps; signs a JWT + calls the
Firestore REST API). Provide it explicitly — the script never reads a committed
in-repo path:

1. `--key=<path>`
2. `$GOOGLE_APPLICATION_CREDENTIALS`

```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/.config/rihlah/firebase-admin.json
node scripts/prayer-times/seed-prayer-times.mjs --year=2026 --apply
```

> **Store the key OUTSIDE the repo.** Service-account keys are full backend
> credentials and must never be committed. The keys that previously lived in
> `files/` were exposed on the public GitHub repo and must be rotated — see
> [SECURITY.md](../../SECURITY.md).

## Document shape

Each doc in `prayerTimes{YEAR}`:

```json
{ "date": "14/6/2026", "time": { "subuh": "05:36", "syuruk": "07:00", "zohor": "13:07", "asar": "16:32", "maghrib": "19:12", "isyak": "20:27" } }
```

`date` is `D/M/YYYY` (no zero padding). Times are 24h `HH:MM`. Backups land in
`data/backups/` (git-ignored).
