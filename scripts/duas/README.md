# Seeding du'as (`doas` collection)

The app currently ships ~10 du'as (Firestore `doas`). This pipeline expands that
from a **vetted dataset** without anyone hand-typing Arabic.

## ⚠️ This is sacred text

The script writes Arabic du'a text + translations that users read as worship.
It **never invents content** — it ingests a dataset *you* supply. Before
`--apply`:

1. Use a reputable source (see below).
2. **Have the Arabic + translations reviewed** — ideally by an asatizah /
   qualified reviewer. This matches the app's "defer to MUIS / qualified
   scholars" principle.
3. Eyeball the dry-run output (it prints a preview + validation issues).

## Recommended source

**Hisnul Muslim (Fortress of the Muslim)** by Saʿīd al-Qaḥṭānī — the standard
authentic collection (~130 du'as with Arabic, transliteration, translation, and
hadith references). Several open JSON datasets exist; pick one you trust and
verify it. Choose one that includes **transliteration** (the app's
`romanizedText`) if you want that field populated.

## Expected shape (the app's `Doa`)

```jsonc
[
  {
    "number": "1",                 // string; unique
    "title": "Waking up",          // category / title
    "arabicText": "…",             // Arabic
    "romanizedText": "…",          // transliteration (optional)
    "englishTranslation": "…",
    "source": "Bukhari 6312"       // reference
  }
]
```

The seeder **auto-maps** common alternative keys (`arabic`/`text` → `arabicText`,
`transliteration`/`latin` → `romanizedText`, `translation`/`en` →
`englishTranslation`, `reference` → `source`, `category` → `title`). Use
`--inspect` to see a source's actual keys first.

## Usage

```bash
# 1. Inspect a source's structure (keys + one sample)
node scripts/duas/seed-duas.mjs --source=<raw-json-url> --inspect

# 2. Dry run — normalise + validate + preview (no writes). Default file:
#    scripts/duas/data/duas.json   (or pass --source=<url> / --file=<path>)
node scripts/duas/seed-duas.mjs --file=scripts/duas/data/duas.json

# 3. Apply — backs up the live `doas` collection first, then upserts
node scripts/duas/seed-duas.mjs --file=scripts/duas/data/duas.json --apply

# Full reseed (delete existing docs first, then write the dataset):
node scripts/duas/seed-duas.mjs --file=… --apply --replace
```

**Auth** (same as the prayer-times seeder — never commit keys): pass
`--key=<path>` or set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON
stored **outside** the repo.

## Notes

- Idempotent: each du'a is written to doc id `dua-<number>`, so re-running
  updates rather than duplicates. `--apply` always writes a timestamped backup
  to `scripts/duas/backups/` first.
- The app caches du'as (TTL); after seeding, the list refreshes on next fetch /
  cache expiry. Force a refresh by clearing the app's storage if testing
  immediately.
- `data/duas.json` is git-ignored by default if it contains a large dataset —
  keep the vetted source-of-truth wherever you manage it.
