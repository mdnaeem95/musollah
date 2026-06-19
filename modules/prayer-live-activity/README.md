# prayer-live-activity (iOS Live Activity)

Lock Screen / Dynamic Island **prayer countdown** Live Activity (ActivityKit).

## Pieces

| Piece | File |
|---|---|
| App-side controller (start/update/end) | `ios/PrayerLiveActivityModule.swift` (this module) |
| JS API (safe no-op off iOS 16.1+) | `index.ts` → `PrayerLiveActivity` |
| SwiftUI Live Activity UI | `targets/widget/WidgetLiveActivity.swift` (widget target) |
| Lifecycle hook | `hooks/prayer/usePrayerLiveActivity.ts` (used by the prayer tab) |
| Config | `app.config.js` → `ios.infoPlist.NSSupportsLiveActivities: true` |

## How it works

- The Live Activity counts down **on-device** via SwiftUI timer text (`Text(timerInterval:)`), so JS only needs to **(re)start** the activity when the next prayer advances — no per-second bridge traffic, battery-friendly.
- `usePrayerLiveActivity` runs on the prayer tab; when `nextPrayerInfo.prayer` changes it calls `PrayerLiveActivity.start(prayer, targetEpoch, clockLabel)`.
- The Swift controller keeps only one prayer activity alive (it ends existing ones before starting a new one) and sets a `staleDate` of prayer-time + 60s.
- Min iOS stays **15.6** — all ActivityKit code is `#available(iOS 16.1, *)`-gated; older devices simply don't get the activity.

## Build & test (must be done on a Mac)

This is native code — it can't be validated by `tsc`/Metro. Steps:

```bash
npx expo prebuild --clean   # regenerates ios/ with NSSupportsLiveActivities,
                            # the widget Live Activity, and this local module
npm run ios                 # native dev-client build (iOS 16.1+ device/sim)
```

Then:
1. Ensure **Settings → (Rihlah) → Live Activities** is ON (and Face ID / Dynamic Island for the island UI).
2. Open the **Prayer** tab → the activity should appear on the Lock Screen and (on 14 Pro+) the Dynamic Island, counting down to the next prayer.
3. Lock the phone — the countdown keeps ticking on-device.

## ⚠️ Cross-target attributes caveat

`PrayerLiveActivityAttributes` is **duplicated** (byte-for-byte) in two targets:
- `ios/PrayerLiveActivityModule.swift` (app)
- `targets/widget/WidgetLiveActivity.swift` (widget extension)

ActivityKit matches the app's `Activity<PrayerLiveActivityAttributes>` to the
widget's `ActivityConfiguration(for:)` by this type. **Keep the two structs
identical.** If activities start (you get an id back) but the UI never renders,
the matching failed — the fix is to share a single source file across both
targets (e.g. via a small config plugin that adds the file to both Xcode target
build phases) instead of duplicating it.

## Known limitations (v1)

- Started/refreshed when the **Prayer tab is viewed**. A fuller version would
  also (re)start at app launch (e.g. from `useLazyInit`, which already fetches
  prayer times for the home-screen widget) and/or schedule the next prayer's
  activity via a push token.
- The widget extension must build against the iOS 16.1+ SDK. If the build
  complains about ActivityKit availability, set a `deploymentTarget` in
  `targets/widget/expo-target.config.js`.
