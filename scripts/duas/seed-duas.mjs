#!/usr/bin/env node
/**
 * Seed / expand the `doas` Firestore collection (the app's du'as) from a vetted
 * dataset — e.g. Hisnul Muslim / Fortress of the Muslim.
 *
 * ⚠️ SACRED TEXT: this writes Arabic du'a text + translations that users will
 * read as worship. The script NEVER invents content — it ingests a dataset you
 * supply and reviews. Verify the source (ideally with an asatizah/qualified
 * reviewer) and eyeball the dry-run before --apply. See scripts/duas/README.md.
 *
 * SOURCE (pick one):
 *   --file=<path.json>     a local JSON array you've vetted (default: scripts/duas/data/duas.json)
 *   --source=<url>         fetch a JSON array at runtime (byte-accurate, no retyping)
 *
 *   Each raw entry is normalised to the app's Doa shape:
 *     { number, title, arabicText, romanizedText, englishTranslation, source }
 *   Common alternative keys are auto-mapped (arabic/text → arabicText,
 *   transliteration/latin → romanizedText, translation/en → englishTranslation,
 *   reference → source, category → title). Use --inspect to see a source's keys.
 *
 * USAGE:
 *   node scripts/duas/seed-duas.mjs --source=<url> --inspect          # print the source's keys + 1 sample
 *   node scripts/duas/seed-duas.mjs --file=data/duas.json            # dry run: normalise + validate + preview
 *   node scripts/duas/seed-duas.mjs --file=data/duas.json --apply    # back up `doas`, then upsert
 *   node scripts/duas/seed-duas.mjs --file=... --apply --replace     # also delete existing docs first (full reseed)
 *
 * AUTH (same as the prayer-times seeder — no in-repo keys):
 *   --key=<path>  or  $GOOGLE_APPLICATION_CREDENTIALS  (store OUTSIDE the repo)
 *
 * No npm deps — signs a JWT and calls the Firestore REST API directly.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COLLECTION = 'doas';
const DOA_FIELDS = ['number', 'title', 'arabicText', 'romanizedText', 'englishTranslation', 'source'];

// ---------------------------------------------------------------- args
function parseArgs() {
  const out = { apply: false, replace: false, inspect: false };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    out[m[1]] = m[2] === undefined ? true : m[2];
  }
  out.apply = out.apply === true || out.apply === 'true';
  out.replace = out.replace === true || out.replace === 'true';
  out.inspect = out.inspect === true || out.inspect === 'true';
  if (!out.file && !out.source) out.file = join(__dirname, 'data', 'duas.json');
  return out;
}

// ---------------------------------------------------------------- http
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const r = https.request(options, (resp) => {
      let data = '';
      resp.on('data', (c) => (data += c));
      resp.on('end', () => resolve({ status: resp.statusCode, body: data }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function fetchJson(url) {
  const u = new URL(url);
  const res = await httpsRequest(
    { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers: { 'User-Agent': 'rihlah-duas-seed', Accept: 'application/json' } },
    null
  );
  if (res.status >= 300) throw new Error(`fetch ${url} → ${res.status}`);
  return JSON.parse(res.body);
}

// ---------------------------------------------------------------- normalise
const firstOf = (obj, keys) => {
  for (const k of keys) {
    if (obj[k] != null && String(obj[k]).trim() !== '') return String(obj[k]).trim();
  }
  return '';
};

// Find an array of entries inside arbitrary JSON (array, or { data: [...] }, etc.)
function extractEntries(json) {
  if (Array.isArray(json)) return json;
  for (const v of Object.values(json ?? {})) {
    if (Array.isArray(v)) return v;
  }
  // nested one level (e.g. chapters → each has ayahs/duas)
  const nested = [];
  for (const v of Object.values(json ?? {})) {
    if (v && typeof v === 'object') {
      for (const vv of Object.values(v)) if (Array.isArray(vv)) nested.push(...vv);
    }
  }
  return nested;
}

function normalise(raw, index) {
  const arabicText = firstOf(raw, ['arabicText', 'arabic', 'ARABIC_TEXT', 'text_ar', 'dua', 'text']);
  const romanizedText = firstOf(raw, ['romanizedText', 'transliteration', 'latin', 'transliteration_en', 'pronunciation']);
  const englishTranslation = firstOf(raw, ['englishTranslation', 'translation', 'en', 'translation_en', 'meaning', 'text_en']);
  const source = firstOf(raw, ['source', 'reference', 'REFERENCE', 'narrated_by', 'ref']);
  const title = firstOf(raw, ['title', 'category', 'TITLE', 'name', 'heading']) || `Du'a ${index + 1}`;
  const number = firstOf(raw, ['number', 'id', 'ID']) || String(index + 1);
  return { number, title, arabicText, romanizedText, englishTranslation, source };
}

function validate(duas) {
  const issues = [];
  const seen = new Set();
  duas.forEach((d, i) => {
    if (!d.arabicText) issues.push(`#${i + 1} (${d.title}): missing arabicText`);
    if (!d.englishTranslation) issues.push(`#${i + 1} (${d.title}): missing englishTranslation`);
    if (seen.has(d.number)) issues.push(`#${i + 1}: duplicate number "${d.number}"`);
    seen.add(d.number);
  });
  return issues;
}

// ---------------------------------------------------------------- firestore (JWT + REST, no deps)
function loadServiceAccount(keyArg) {
  const path = keyArg || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path && existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  throw new Error(
    'No service-account key found. Pass --key=<path> or set GOOGLE_APPLICATION_CREDENTIALS ' +
    'to a key stored OUTSIDE the repo. Do not commit service-account keys.'
  );
}

const b64url = (i) => Buffer.from(i).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const si = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))}`;
  const sig = b64url(crypto.createSign('RSA-SHA256').update(si).sign(sa.private_key));
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${si}.${sig}`;
  const res = await httpsRequest(
    { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } },
    body
  );
  const json = JSON.parse(res.body);
  if (!json.access_token) throw new Error('OAuth token error: ' + res.body);
  return json.access_token;
}

async function listCollection(project, tok) {
  const docs = [];
  let pageToken = '';
  do {
    const path = `/v1/projects/${project}/databases/(default)/documents/${COLLECTION}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await httpsRequest({ hostname: 'firestore.googleapis.com', path, method: 'GET', headers: { Authorization: `Bearer ${tok}` } }, null);
    const json = JSON.parse(res.body || '{}');
    (json.documents || []).forEach((d) => docs.push({ name: d.name, fields: d.fields }));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return docs;
}

const docFields = (d) => ({
  fields: DOA_FIELDS.reduce((acc, k) => ((acc[k] = { stringValue: String(d[k] ?? '') }), acc), {}),
});

const docId = (d) => `dua-${String(d.number).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}`;

async function commit(project, tok, writes) {
  for (let i = 0; i < writes.length; i += 200) {
    const batch = writes.slice(i, i + 200);
    const res = await httpsRequest(
      { hostname: 'firestore.googleapis.com', path: `/v1/projects/${project}/databases/(default)/documents:commit`, method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' } },
      JSON.stringify({ writes: batch })
    );
    if (res.status !== 200) throw new Error(`commit failed ${res.status}: ${res.body.slice(0, 500)}`);
    console.log(`  committed ${Math.min(i + batch.length, writes.length)}/${writes.length}`);
  }
}

// ---------------------------------------------------------------- main
async function main() {
  const args = parseArgs();

  const rawJson = args.source ? await fetchJson(args.source) : JSON.parse(readFileSync(args.file, 'utf8'));
  const entries = extractEntries(rawJson);
  if (!entries.length) throw new Error('No entries found in the dataset.');

  if (args.inspect) {
    console.log(`Source has ${entries.length} entries. Keys of first entry:`);
    console.log('  ' + Object.keys(entries[0]).join(', '));
    console.log('Sample (raw):\n' + JSON.stringify(entries[0], null, 2).split('\n').map((l) => '  ' + l).join('\n'));
    return;
  }

  const duas = entries.map(normalise);
  const issues = validate(duas);

  console.log(`Parsed ${duas.length} du'as → Doa shape.`);
  console.log('Preview (first 3):');
  duas.slice(0, 3).forEach((d) => console.log(`  ${d.number}. ${d.title} — ${d.arabicText.slice(0, 30)}… | ${d.englishTranslation.slice(0, 50)}… [${d.source}]`));
  if (issues.length) {
    console.log(`\n⚠️  ${issues.length} validation issue(s):`);
    issues.slice(0, 20).forEach((i) => console.log('  - ' + i));
  }

  if (!args.apply) {
    console.log('\nDRY RUN — review the above (esp. Arabic accuracy) then re-run with --apply.');
    return;
  }

  // ---- apply
  const sa = loadServiceAccount(args.key);
  const project = sa.project_id;
  const tok = await getAccessToken(sa);

  // Back up existing collection first.
  const existing = await listCollection(project, tok);
  const backupDir = join(__dirname, 'backups');
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(backupDir, `doas-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(existing, null, 2));
  console.log(`\nBacked up ${existing.length} existing doc(s) → ${backupPath}`);

  const writes = [];
  if (args.replace) {
    existing.forEach((d) => writes.push({ delete: d.name }));
  }
  duas.forEach((d) => writes.push({
    update: { name: `projects/${project}/databases/(default)/documents/${COLLECTION}/${docId(d)}`, ...docFields(d) },
  }));

  console.log(`Committing ${writes.length} write(s) (${args.replace ? 'replace + ' : ''}upsert)…`);
  await commit(project, tok, writes);
  console.log('Done. Re-open the app (clear the duas cache) to see them.');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
