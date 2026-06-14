# Security: leaked credentials — remediation runbook

On **2026-06-14**, an audit found secrets committed to this **public** GitHub repo
(`github.com/mdnaeem95/musollah`). They were tracked since commit `849011a` and
are therefore in git history and likely already scraped by automated bots.

**Treat every item below as compromised. Rotation is mandatory — untracking and
history-scrubbing do NOT undo a public leak.**

## What leaked

| Secret | File | Identity | Severity |
|---|---|---|---|
| Firebase **Admin SDK** private key | `files/musollah-15cfe-firebase-adminsdk-v4bol-11f5f1fe7b.json` | `firebase-adminsdk-v4bol@musollah-15cfe.iam.gserviceaccount.com` (key id `11f5f1fe7b…`) | **Critical** — full read/write to Firestore, Auth, Storage |
| **Google Play** service-account key | `files/musollah-15cfe-8de31f971b99.json` | `gooleplayandroidrihlah@musollah-15cfe.iam.gserviceaccount.com` (key id `8de31f97…`) | **High** — Play Console API / publishing |
| **Sentry** auth token | `.env` (`EXPO_PUBLIC_SENTRY_AUTH_TOKEN`) | org `rihlah` | Medium |
| Android **keystore** secret | `files/credentials.json` (`android.keystore`) | app signing | Medium/High |

> The `EXPO_PUBLIC_FIREBASE*` values in `.env` and the API keys in
> `GoogleService-Info.plist` / `google-services.json` are **client config**, not
> private keys — they ship in the app and are not secret in the same way. Still,
> restrict the Firebase/Maps API keys in the console (see step 5).

## Already done (repo hygiene — in this commit)

- Untracked the four secrets via `git rm --cached` (they remain on disk locally).
- Added `.gitignore` rules so they can't be re-committed.
- Decoupled `scripts/prayer-times/seed-prayer-times.mjs` from any in-repo key —
  it now requires `--key=<path>` or `GOOGLE_APPLICATION_CREDENTIALS` pointing
  **outside** the repo.

This stops *future* commits. It does **not** remove the secrets from existing
history or from GitHub. Do the rotation below.

## Required actions (console — cannot be automated here)

### 1. Rotate the Firebase Admin SDK key — do first
1. [Firebase Console](https://console.firebase.google.com/) → project `musollah-15cfe`
   → ⚙️ → **Service accounts** → **Manage service account permissions**
   (opens Google Cloud IAM → Service Accounts).
2. Open `firebase-adminsdk-v4bol@musollah-15cfe.iam.gserviceaccount.com` → **Keys**.
3. **Add key → Create new key (JSON)**. Save it OUTSIDE the repo, e.g.
   `~/.config/rihlah/firebase-admin.json`.
4. **Delete** the old key id `11f5f1fe7b…`.
5. Point tooling at the new key:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=~/.config/rihlah/firebase-admin.json
   ```

### 2. Rotate the Google Play service-account key
1. Google Cloud IAM → Service Accounts → `gooleplayandroidrihlah@musollah-15cfe.iam.gserviceaccount.com`
   → **Keys** → create new JSON, **delete** old key id `8de31f97…`.
2. Update wherever it's used (EAS submit / Play publishing CI). Store outside the repo.

### 3. Rotate the Sentry auth token
1. Sentry → Settings → Auth Tokens → revoke the leaked token, create a new one.
2. Put it in a local `.env` (now git-ignored) and/or store as an **EAS secret**
   (`eas secret:create`). Do not commit it.

### 4. Reassess the Android keystore
1. If `files/credentials.json` held the keystore **password**, the keystore file
   itself was not in the repo, but the password is public. You cannot change the
   key of an already-published Play app (Play App Signing holds the upload key),
   but you **can and should** rotate the **upload key** via Play Console →
   Setup → App signing → "Request upload key reset", and change any leaked
   password.

### 5. Lock down API keys (defense in depth)
- Google Cloud → APIs & Services → Credentials: add app/referrer + API
  restrictions to the Maps and Firebase browser keys.
- Firebase → App Check + tighten Firestore security rules (the leaked admin key
  bypassed rules entirely while live).

### 6. Git history scrub — DONE locally, needs your push

The history has already been rewritten locally and verified clean. The scrub
removed **9 paths** carrying the 4 secrets across every location they ever lived:

- `.env`, `android/sentry.properties`, `ios/sentry.properties` (Sentry token — it
  was in the properties files too, not just `.env`, and was rotated once mid-history)
- `credentials.json` + `files/credentials.json` (keystore secret)
- the two SA keys at both repo-root and `files/` paths

Local state now:
- `main` → scrubbed tip; your uncommitted WIP is preserved.
- Original history is recoverable via tag `prescrub-backup-20260614` and the
  bundle at `/tmp/musollah-PRESCRUB-*.bundle`.

The remote `main` was 3 commits **ahead** of the local base (nitro-modules peer
dep, `.npmrc`, an Android build commit — none touch secrets). The scrub was
therefore rebuilt on the real remote tip `b555391`, so all 3 commits are
preserved. The cleaned history lives in a prepared mirror at
`/tmp/musollah-mirror2.git` (scrubbed tip `bda210d`), with `origin` already
pointing at GitHub.

**To publish the scrub (run from your authenticated terminal — the sandboxed
agent shell has no GitHub SSH access):**

```bash
# 1. Push the cleaned history from the prepared mirror. The lease is pinned to
#    the exact current remote tip, so it ONLY overwrites if nothing new landed.
cd /tmp/musollah-mirror2.git
git push --force-with-lease=main:b555391293a4f082db766feb0a20b4332fbb3a44 origin main

# 2. Delete the stale dependabot branch (it shares the old secret history;
#    dependabot recreates it if the serve-static bump still matters)
git push origin --delete dependabot/npm_and_yarn/serve-static-1.16.2

# 3. Verify the REMOTE is clean
git fetch origin
git grep -lI "sntrys_\|BEGIN .*PRIVATE KEY" $(git rev-list --remotes=origin) && echo "STILL DIRTY" || echo "clean"
```

If step 1 is rejected with "stale info", the remote moved again — run
`git rev-parse origin/main` and re-scope before forcing.

**Then realign your working repo** (`~/Documents/musollah`, still at the
pre-scrub commit `3a9cef9` + your WIP):

```bash
git fetch origin
git reset --soft origin/main      # moves main to the scrubbed tip; keeps all your WIP
```

Because your working tree predates the remote's 3 dependency commits, `.npmrc`
and `package.json`/`package-lock.json` will show as local changes after this —
resolve to taste (e.g. `git checkout origin/main -- .npmrc package-lock.json` to
take the remote's versions, then re-apply your `package.json` edits).

Backups: original local history → tag `prescrub-backup-20260614` and
`/tmp/musollah-PRESCRUB-*.bundle`.

⚠️ This **rewrites history and force-pushes** — every commit SHA changes and
existing clones/forks break. **Forks and GitHub's cached views may still retain
the old blobs**, which is why **rotation (steps 1–4 above), not scrubbing, is the
real fix.** Do the rotation regardless.

## Verification (local — already passing)

```bash
git ls-files | grep -E 'adminsdk|credentials\.json|^\.env$|sentry\.properties'  # nothing
git check-ignore .env files/credentials.json files/musollah-15cfe-*.json android/sentry.properties
```
