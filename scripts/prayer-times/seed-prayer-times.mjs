#!/usr/bin/env node
/**
 * Seed / repair the `prayerTimes{YEAR}` Firestore collection from the official
 * MUIS Singapore prayer timetable.
 *
 * This is the authoritative, validated replacement for whatever ad-hoc process
 * originally populated the prayer-time collections (which silently drifted off
 * the real MUIS times — see the 2026 incident). Run it once per year with the
 * official MUIS table; never hand-edit prayer times in Firestore again.
 *
 * SOURCE OF TRUTH:
 *   MUIS publishes "Prayer Times for Singapore YEAR <yyyy>" as a PDF.
 *   Paste its rows into scripts/prayer-times/data/<year>.txt (see that folder's
 *   README). The printed table is a 12-hour clock with no AM/PM; this script
 *   converts to 24h using the fixed Singapore prayer ordering.
 *
 * USAGE:
 *   node scripts/prayer-times/seed-prayer-times.mjs --year=2026            # dry run (audit + backup only)
 *   node scripts/prayer-times/seed-prayer-times.mjs --year=2026 --apply    # write corrections
 *   node scripts/prayer-times/seed-prayer-times.mjs --year=2027 --file=path --apply
 *
 * AUTH:
 *   Uses a Firebase service-account JSON, supplied explicitly (never read from a
 *   committed in-repo path). Resolution order:
 *     1. --key=<path>
 *     2. $GOOGLE_APPLICATION_CREDENTIALS
 *   Store the key OUTSIDE the repo (e.g. ~/.config/rihlah/) — service-account
 *   keys must never be committed. No npm deps required (signs a JWT and calls
 *   the Firestore REST API directly).
 *
 * SAFETY:
 *   - Validates the parsed table before touching Firestore (day count, no
 *     duplicates, per-day prayer ordering, day-to-day continuity <= 3 min).
 *     Any validation failure aborts before any write.
 *   - Always writes a timestamped backup of the live collection first.
 *   - Only `--apply` writes. Without it, the script just audits and backs up.
 *   - After applying, re-reads the collection and asserts 100% match.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRAYERS = ['subuh', 'syuruk', 'zohor', 'asar', 'maghrib', 'isyak'];

// ---------------------------------------------------------------- args
function parseArgs() {
  const out = { apply: false };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  if (!out.year) {
    console.error('Missing --year=YYYY');
    process.exit(1);
  }
  out.year = parseInt(out.year, 10);
  out.apply = out.apply === true || out.apply === 'true';
  out.file = out.file || join(__dirname, 'data', `${out.year}.txt`);
  return out;
}

// ---------------------------------------------------------------- parse + convert
function daysInYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

function to24(name, h, m) {
  let H;
  if (name === 'subuh' || name === 'syuruk') H = h;       // morning (AM)
  else H = h === 12 ? 12 : h + 12;                          // afternoon/evening (PM); zohor 12 = noon
  return `${String(H).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Parse a MUIS table file into [{ date: "D/M/YYYY", time: {subuh,...} }]. */
function parseTable(filePath, year) {
  const raw = readFileSync(filePath, 'utf8');
  const rows = [];
  for (const line of raw.split('\n')) {
    const dateMatch = line.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (!dateMatch) continue; // skip headers / blank lines
    const [, d, mo, y] = dateMatch;
    if (parseInt(y, 10) !== year) continue;
    // every integer token after the date; day-of-week words are skipped automatically
    const after = line.slice(line.indexOf(dateMatch[0]) + dateMatch[0].length);
    const nums = (after.match(/\d+/g) || []).map(Number);
    if (nums.length !== 12) {
      throw new Error(`Expected 12 time numbers, got ${nums.length} on line: "${line.trim()}"`);
    }
    const time = {};
    PRAYERS.forEach((p, i) => { time[p] = to24(p, nums[i * 2], nums[i * 2 + 1]); });
    rows.push({ date: `${parseInt(d, 10)}/${parseInt(mo, 10)}/${y}`, time });
  }
  return rows;
}

/** Hard validation. Throws (aborts) on any anomaly. */
function validate(rows, year) {
  const expected = daysInYear(year);
  if (rows.length !== expected) {
    throw new Error(`Parsed ${rows.length} days but ${year} has ${expected}.`);
  }
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.date)) throw new Error(`Duplicate date: ${r.date}`);
    seen.add(r.date);
    // intra-day ordering: subuh < syuruk < zohor < asar < maghrib < isyak
    const mins = PRAYERS.map((p) => minutes(r.time[p]));
    for (let i = 1; i < mins.length; i++) {
      if (mins[i] <= mins[i - 1]) {
        throw new Error(`Out-of-order prayers on ${r.date}: ${JSON.stringify(r.time)}`);
      }
    }
  }
  // day-to-day continuity: prayer times shift ~1 min/day in Singapore; flag > 3 min jumps
  for (let i = 1; i < rows.length; i++) {
    for (const p of PRAYERS) {
      const delta = Math.abs(minutes(rows[i].time[p]) - minutes(rows[i - 1].time[p]));
      if (delta > 3) {
        throw new Error(`Continuity error (${p}): ${rows[i - 1].date}=${rows[i - 1].time[p]} -> ${rows[i].date}=${rows[i].time[p]} (Δ${delta}m). Likely a transcription typo.`);
      }
    }
  }
}

// ---------------------------------------------------------------- firestore (JWT + REST, no deps)
function loadServiceAccount(keyArg) {
  // Only explicit sources — never a committed in-repo path.
  const candidates = [keyArg, process.env.GOOGLE_APPLICATION_CREDENTIALS].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return { sa: JSON.parse(readFileSync(p, 'utf8')), path: p };
  }
  throw new Error(
    'No service-account key found. Pass --key=<path> or set GOOGLE_APPLICATION_CREDENTIALS ' +
    'to a key stored OUTSIDE the repo. Do not commit service-account keys.'
  );
}

const b64url = (i) => Buffer.from(i).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

function httpsRequest(options, body) {
  return new Promise((res, rej) => {
    const r = https.request(options, (resp) => {
      let d = '';
      resp.on('data', (c) => (d += c));
      resp.on('end', () => res({ status: resp.statusCode, body: d }));
    });
    r.on('error', rej);
    if (body) r.write(body);
    r.end();
  });
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const si = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))}`;
  const sig = crypto.createSign('RSA-SHA256').update(si).sign(sa.private_key)
    .toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${si}.${sig}`;
  const res = await httpsRequest({
    hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
  }, body);
  const json = JSON.parse(res.body);
  if (!json.access_token) throw new Error('OAuth token error: ' + res.body);
  return json.access_token;
}

function decodeFields(fields) {
  const o = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (v.stringValue !== undefined) o[k] = v.stringValue;
    else if (v.mapValue) o[k] = decodeFields(v.mapValue.fields);
    else o[k] = v;
  }
  return o;
}

async function listCollection(project, tok, collection) {
  const docs = [];
  let pageToken = '';
  do {
    const path = `/v1/projects/${project}/databases/(default)/documents/${collection}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await httpsRequest({ hostname: 'firestore.googleapis.com', path, method: 'GET', headers: { Authorization: `Bearer ${tok}` } });
    const j = JSON.parse(res.body);
    if (j.error) throw new Error(JSON.stringify(j.error));
    (j.documents || []).forEach((d) => docs.push({ id: d.name.split('/').pop(), data: decodeFields(d.fields) }));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return docs;
}

function timeMapValue(time) {
  const fields = {};
  for (const p of PRAYERS) fields[p] = { stringValue: time[p] };
  return { mapValue: { fields } };
}

function newDocId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomBytes(20)).map((b) => chars[b % chars.length]).join('');
}

async function commit(project, tok, writes) {
  let done = 0;
  for (let i = 0; i < writes.length; i += 200) {
    const chunk = writes.slice(i, i + 200);
    const body = JSON.stringify({ writes: chunk });
    const res = await httpsRequest({
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${project}/databases/(default)/documents:commit`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}`, 'Content-Length': Buffer.byteLength(body) },
    }, body);
    if (res.status !== 200) throw new Error(`commit failed ${res.status}: ${res.body.slice(0, 500)}`);
    done += (JSON.parse(res.body).writeResults || []).length;
    console.log(`  committed ${done}/${writes.length}`);
  }
}

// ---------------------------------------------------------------- main
(async () => {
  const args = parseArgs();
  const collection = `prayerTimes${args.year}`;
  console.log(`\n== Seed prayer times: ${collection} ==`);
  console.log(`Source file: ${args.file}`);

  const rows = parseTable(args.file, args.year);
  validate(rows, args.year);
  console.log(`Parsed + validated ${rows.length} days (count ok, ordered, continuous).`);

  const { sa, path: keyPath } = loadServiceAccount(args.key);
  console.log(`Service account: ${keyPath}`);
  const tok = await getAccessToken(sa);
  const live = await listCollection(sa.project_id, tok, collection);
  console.log(`Live docs in ${collection}: ${live.length}`);

  // backup
  const backupDir = join(__dirname, 'data', 'backups');
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(backupDir, `${collection}.${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(live, null, 2));
  console.log(`Backup written: ${backupPath}`);

  // diff
  const byDate = new Map(live.map((d) => [d.data.date, d]));
  const writes = [];
  let exact = 0;
  const diffs = [];
  const perPrayerMax = Object.fromEntries(PRAYERS.map((p) => [p, 0]));
  for (const r of rows) {
    const doc = byDate.get(r.date);
    const cellDiffs = {};
    if (!doc) {
      // missing -> create
      writes.push({ update: { name: `projects/${sa.project_id}/databases/(default)/documents/${collection}/${newDocId()}`, fields: { date: { stringValue: r.date }, time: timeMapValue(r.time) } } });
      diffs.push({ date: r.date, note: 'CREATE (missing)' });
      continue;
    }
    const t = doc.data.time || {};
    for (const p of PRAYERS) {
      if (t[p] !== r.time[p]) {
        cellDiffs[p] = `${t[p] ?? '∅'}->${r.time[p]}`;
        if (t[p]) perPrayerMax[p] = Math.max(perPrayerMax[p], Math.abs(minutes(t[p]) - minutes(r.time[p])));
      }
    }
    if (Object.keys(cellDiffs).length === 0) { exact++; continue; }
    diffs.push({ date: r.date, cellDiffs });
    writes.push({ update: { name: `projects/${sa.project_id}/databases/(default)/documents/${collection}/${doc.id}`, fields: { time: timeMapValue(r.time) } }, updateMask: { fieldPaths: ['time'] } });
  }
  const extra = live.filter((d) => !rows.find((r) => r.date === d.data.date)).map((d) => d.data.date);

  console.log('\n--- AUDIT ---');
  console.log(`Exact matches:        ${exact}/${rows.length}`);
  console.log(`Need create/update:   ${writes.length}`);
  console.log(`Extra/unmatched docs: ${extra.length}${extra.length ? ' -> ' + extra.slice(0, 8).join(', ') : ''}`);
  console.log(`Max error/prayer (min): ${JSON.stringify(perPrayerMax)}`);
  for (const d of diffs.slice(0, 8)) console.log('  ', d.date, JSON.stringify(d.cellDiffs || d.note));
  if (diffs.length > 8) console.log(`  ... and ${diffs.length - 8} more`);

  if (!args.apply) {
    console.log('\nDRY RUN. Re-run with --apply to write these corrections.');
    return;
  }
  if (writes.length === 0) {
    console.log('\nNothing to write — collection already matches MUIS.');
    return;
  }

  console.log(`\nApplying ${writes.length} writes...`);
  await commit(sa.project_id, tok, writes);

  // verify
  const after = await listCollection(sa.project_id, tok, collection);
  const afterByDate = new Map(after.map((d) => [d.data.date, d]));
  let mismatch = 0;
  for (const r of rows) {
    const t = afterByDate.get(r.date)?.data.time || {};
    for (const p of PRAYERS) if (t[p] !== r.time[p]) mismatch++;
  }
  if (mismatch === 0) console.log(`\n✔ Verified: all ${rows.length} days now match MUIS exactly.`);
  else { console.error(`\n✗ Verification FAILED: ${mismatch} cells still off.`); process.exit(1); }
})().catch((e) => { console.error('\nFATAL:', e.message); process.exit(1); });
