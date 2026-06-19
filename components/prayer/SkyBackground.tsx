/**
 * SkyBackground — procedural animated sky tied to real Islamic prayer times.
 *
 * Sky gradient, sun arc, moon arc, stars, and horizon glow all update every
 * 30 seconds based on the current time relative to Subuh / Syuruk / Zohor /
 * Asar / Maghrib / Isyak.
 *
 * No Reanimated — plain React state is sufficient because sky changes are
 * imperceptibly gradual at the 30-second cadence.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Rect,
  G,
} from 'react-native-svg';

// ============================================================================
// SCREEN CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HORIZON_Y = SCREEN_HEIGHT * 0.88;
const ARC_HEIGHT = SCREEN_HEIGHT * 0.7;

// ============================================================================
// SKY PALETTE KEYFRAMES
// Each palette is [top, upper-mid, lower-mid, bottom] gradient stops.
// ============================================================================

const PALETTES = {
  night:      ['#010409', '#020817', '#080D24', '#0D1535'],
  predawn:    ['#0C1028', '#190E3E', '#3D1868', '#D4440A'],
  sunrise:    ['#1A2F5C', '#C2410C', '#F97316', '#FDE68A'],
  morning:    ['#075985', '#0EA5E9', '#38BDF8', '#7DD3FC'],
  midday:     ['#0C4A6E', '#0284C7', '#38BDF8', '#BAE6FD'],
  afternoon:  ['#064E84', '#0369A1', '#FB923C', '#FDE68A'],
  goldenHour: ['#7C2D12', '#C2410C', '#F97316', '#FDE68A'],
  sunset:     ['#2D0558', '#6D28D9', '#9D1B4A', '#F97316'],
  twilight:   ['#070A1A', '#0D1240', '#1A1758', '#0B1030'],
} as const;

type Palette = readonly [string, string, string, string];

// ============================================================================
// COLOR MATH HELPERS
// ============================================================================

/**
 * Parse a #RRGGBB hex string into { r, g, b } (0-255 each).
 * Handles both 6-char and 8-char (#RRGGBBAA) hex — alpha is ignored.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const s = hex.replace('#', '').slice(0, 6);
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  };
}

/**
 * Convert { r, g, b } back to a #RRGGBB hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Linearly interpolate between two #RRGGBB hex colours.
 * t = 0 → a, t = 1 → b.
 */
function lerpColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  );
}

/**
 * Interpolate all 4 stops of two palettes by factor t (0-1).
 */
function interpolatePalette(a: Palette, b: Palette, t: number): [string, string, string, string] {
  return [
    lerpColor(a[0], b[0], t),
    lerpColor(a[1], b[1], t),
    lerpColor(a[2], b[2], t),
    lerpColor(a[3], b[3], t),
  ];
}

// ============================================================================
// DETERMINISTIC STAR GENERATION (LCG pseudo-random, fixed seed)
// ============================================================================

function lcgRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (1664525 * s + 1013904223) & 0xffffffff;
    // Unsigned shift to keep positive, normalise to [0, 1)
    return ((s >>> 0) / 0xffffffff);
  };
}

interface Star {
  x: number;
  y: number;
  r: number;          // radius px
  baseOpacity: number;
}

const STAR_COUNT = 70;

const STARS: Star[] = (() => {
  const rand = lcgRandom(0xdeadbeef);
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: rand() * SCREEN_WIDTH,
      y: rand() * SCREEN_HEIGHT * 0.72,
      r: 0.5 + rand() * 1.5,
      baseOpacity: 0.5 + rand() * 0.5,
    });
  }
  return stars;
})();

// ============================================================================
// TIME HELPERS
// ============================================================================

/**
 * Parse "HH:MM" → total minutes since midnight.
 */
function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Current time as minutes since midnight (float).
 */
function nowMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

/**
 * Clamp t to [0, 1].
 */
function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Linear progress between two minute values, clamped to [0, 1].
 */
function progress(current: number, start: number, end: number): number {
  if (end <= start) return 0;
  return clamp01((current - start) / (end - start));
}

// ============================================================================
// SKY STATE COMPUTATION
// ============================================================================

interface SkyState {
  gradientColors: [string, string, string, string];
  gradientLocations: [number, number, number, number];
  // Sun
  sunVisible: boolean;
  sunX: number;
  sunY: number;
  sunProgress: number; // 0 at syuruk, 1 at maghrib
  // Moon
  moonVisible: boolean;
  moonX: number;
  moonY: number;
  moonOpacity: number;
  // Stars
  starOpacity: number;
  // Horizon glow
  sunriseGlow: number;  // 0-1 opacity
  sunsetGlow: number;   // 0-1 opacity
}

function computeSkyState(
  prayerTimes: {
    subuh: string;
    syuruk: string;
    zohor: string;
    asar: string;
    maghrib: string;
    isyak: string;
  } | null,
  now: Date,
): SkyState {
  // ---------- Defaults (night sky) ----------
  if (!prayerTimes) {
    return {
      gradientColors: [...PALETTES.night] as [string, string, string, string],
      gradientLocations: [0, 0.35, 0.7, 1],
      sunVisible: false,
      sunX: 0,
      sunY: HORIZON_Y,
      sunProgress: 0,
      moonVisible: true,
      moonX: SCREEN_WIDTH * 0.5,
      moonY: HORIZON_Y - ARC_HEIGHT * 0.85 * Math.sin(0.5 * Math.PI),
      moonOpacity: 1,
      starOpacity: 1,
      sunriseGlow: 0,
      sunsetGlow: 0,
    };
  }

  const t = nowMinutes(now);
  const subuh    = toMinutes(prayerTimes.subuh);
  const syuruk   = toMinutes(prayerTimes.syuruk);
  const zohor    = toMinutes(prayerTimes.zohor);
  const asar     = toMinutes(prayerTimes.asar);
  const maghrib  = toMinutes(prayerTimes.maghrib);
  const isyak    = toMinutes(prayerTimes.isyak);

  // ---- Derived time markers ----
  // Syuruk → Zohor: first third ends sunrise phase, second third ends morning phase
  const syurukToZohorOneThird = syuruk + (zohor - syuruk) / 3;
  const syurukToZohorTwoThirds = syuruk + 2 * (zohor - syuruk) / 3;
  // Zohor → Asar: last third begins the afternoon blend
  const zohorToAsarTwoThirds = zohor + 2 * (asar - zohor) / 3;
  // Asar → Maghrib: first third ends afternoon, second-third ends golden hour
  const asarToMaghribOneThird  = asar + (maghrib - asar) / 3;
  const asarToMaghribTwoThirds = asar + 2 * (maghrib - asar) / 3;

  // ---- Gradient interpolation ----
  // Phases cascade top-to-bottom through the day. Each branch is mutually exclusive.
  let gradientColors: [string, string, string, string];

  if (t < subuh) {
    // 00:00 → Subuh: deep night
    gradientColors = [...PALETTES.night] as [string, string, string, string];
  } else if (t < syuruk) {
    // Subuh → Syuruk: pre-dawn → sunrise colours
    const tt = progress(t, subuh, syuruk);
    gradientColors = interpolatePalette(PALETTES.predawn, PALETTES.sunrise, tt);
  } else if (t < syurukToZohorOneThird) {
    // Syuruk → 1/3 way to Zohor: sunrise → morning
    const tt = progress(t, syuruk, syurukToZohorOneThird);
    gradientColors = interpolatePalette(PALETTES.sunrise, PALETTES.morning, tt);
  } else if (t < syurukToZohorTwoThirds) {
    // 1/3 → 2/3 way to Zohor: morning → midday
    const tt = progress(t, syurukToZohorOneThird, syurukToZohorTwoThirds);
    gradientColors = interpolatePalette(PALETTES.morning, PALETTES.midday, tt);
  } else if (t < zohorToAsarTwoThirds) {
    // 2/3 way to Zohor through 2/3 way to Asar: pure midday
    gradientColors = [...PALETTES.midday] as [string, string, string, string];
  } else if (t < asar) {
    // 2/3 of Zohor→Asar → Asar: midday → afternoon
    const tt = progress(t, zohorToAsarTwoThirds, asar);
    gradientColors = interpolatePalette(PALETTES.midday, PALETTES.afternoon, tt);
  } else if (t < asarToMaghribOneThird) {
    // Asar → 1/3 way to Maghrib: afternoon → golden hour
    const tt = progress(t, asar, asarToMaghribOneThird);
    gradientColors = interpolatePalette(PALETTES.afternoon, PALETTES.goldenHour, tt);
  } else if (t < asarToMaghribTwoThirds) {
    // 1/3 → 2/3 way to Maghrib: golden hour (steady)
    gradientColors = [...PALETTES.goldenHour] as [string, string, string, string];
  } else if (t < maghrib) {
    // 2/3 way to Maghrib → Maghrib: golden hour → sunset
    const tt = progress(t, asarToMaghribTwoThirds, maghrib);
    gradientColors = interpolatePalette(PALETTES.goldenHour, PALETTES.sunset, tt);
  } else if (t < isyak) {
    // Maghrib → Isyak: sunset → twilight
    const tt = progress(t, maghrib, isyak);
    gradientColors = interpolatePalette(PALETTES.sunset, PALETTES.twilight, tt);
  } else {
    // Isyak → midnight: twilight → night
    const midnight = 24 * 60;
    const tt = progress(t, isyak, midnight);
    gradientColors = interpolatePalette(PALETTES.twilight, PALETTES.night, tt);
  }

  // ---- Sun ----
  const sunDuration = maghrib - syuruk;
  const sunProgress = sunDuration > 0 ? clamp01((t - syuruk) / sunDuration) : 0;
  const sunVisible = t >= syuruk && t <= maghrib;
  const sunX = sunProgress * SCREEN_WIDTH;
  const sunY = HORIZON_Y - ARC_HEIGHT * Math.sin(sunProgress * Math.PI);

  // ---- Moon ----
  // Moon is up from Maghrib through the night until Syuruk.
  const moonDuration = (1440 - maghrib) + syuruk; // total minutes moon is visible
  let moonProgress = 0;
  const moonVisible = t >= maghrib || t < syuruk;
  if (moonVisible) {
    if (t >= maghrib) {
      moonProgress = (t - maghrib) / moonDuration;
    } else {
      moonProgress = (t + 1440 - maghrib) / moonDuration;
    }
  }
  moonProgress = clamp01(moonProgress);
  // Right → left arc
  const moonX = SCREEN_WIDTH - moonProgress * SCREEN_WIDTH;
  const moonAltitude = Math.sin(moonProgress * Math.PI); // 0 at horizon, 1 at zenith
  const moonY = HORIZON_Y - ARC_HEIGHT * 0.85 * moonAltitude;
  // Fade the moon out near the horizon — that's also where it clips at the
  // screen edges during rise/set, so it never reads as a hard dot in the corner.
  const moonOpacity = moonVisible ? clamp01(moonAltitude / 0.18) : 0;

  // ---- Star opacity ----
  let starOpacity = 0;
  if (t < subuh) {
    // Midnight → Subuh: full stars
    starOpacity = 1;
  } else if (t < syuruk) {
    // Pre-dawn fade: 1 → 0
    starOpacity = 1 - progress(t, subuh, syuruk);
  } else if (t < maghrib) {
    // Daytime: no stars
    starOpacity = 0;
  } else if (t < isyak) {
    // Twilight: fade in faint stars 0 → 0.3
    starOpacity = progress(t, maghrib, isyak) * 0.3;
  } else {
    // After Isyak: 0.3 → 1 over 45 minutes, then hold at 1
    const rampEnd = isyak + 45;
    if (t < rampEnd) {
      starOpacity = 0.3 + progress(t, isyak, rampEnd) * 0.7;
    } else {
      starOpacity = 1;
    }
  }

  // ---- Horizon glow ----
  const SUNRISE_WINDOW = 25; // minutes either side of syuruk
  const SUNSET_WINDOW  = 30; // minutes either side of maghrib

  let sunriseGlow = 0;
  const sunriseDist = Math.abs(t - syuruk);
  if (sunriseDist <= SUNRISE_WINDOW) {
    sunriseGlow = (1 - sunriseDist / SUNRISE_WINDOW) * 0.5;
  }

  let sunsetGlow = 0;
  const sunsetDist = Math.abs(t - maghrib);
  if (sunsetDist <= SUNSET_WINDOW) {
    sunsetGlow = (1 - sunsetDist / SUNSET_WINDOW) * 0.6;
  }

  return {
    gradientColors,
    gradientLocations: [0, 0.35, 0.7, 1],
    sunVisible,
    sunX,
    sunY,
    sunProgress,
    moonVisible,
    moonX,
    moonY,
    moonOpacity,
    starOpacity,
    sunriseGlow,
    sunsetGlow,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

interface SkyBackgroundProps {
  prayerTimes: {
    subuh: string;
    syuruk: string;
    zohor: string;
    asar: string;
    maghrib: string;
    isyak: string;
  } | null;
  children?: React.ReactNode;
}

export default function SkyBackground({ prayerTimes, children }: SkyBackgroundProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const sky = useMemo(() => computeSkyState(prayerTimes, now), [prayerTimes, now]);

  // Sun appearance — dramatic near horizon, subtle at zenith
  const nearHorizon   = sky.sunProgress < 0.15 || sky.sunProgress > 0.85;
  const veryNear      = sky.sunProgress < 0.05 || sky.sunProgress > 0.95;
  const sunCoreR      = veryNear ? 22 : nearHorizon ? 18 : 12;
  const sunGlowR      = veryNear ? 80 : nearHorizon ? 60 : 42;
  const sunAtmR       = veryNear ? 150 : nearHorizon ? 110 : 72;
  const sunColor      = veryNear ? '#FF5500' : nearHorizon ? '#FF7A00' : '#FFE87A';
  const sunCoreColor  = veryNear ? '#FFD0A0' : nearHorizon ? '#FFF0D0' : '#FFFFFF';

  return (
    <View style={styles.container}>
      {/* Sky gradient */}
      <LinearGradient
        colors={sky.gradientColors as any}
        locations={sky.gradientLocations as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* SVG celestial layer — pointer events none so touches reach children */}
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          {/* Sun outer atmospheric haze */}
          <RadialGradient id="sunAtm" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%"   stopColor={sunColor} stopOpacity="0.18" />
            <Stop offset="50%"  stopColor={sunColor} stopOpacity="0.06" />
            <Stop offset="100%" stopColor={sunColor} stopOpacity="0" />
          </RadialGradient>

          {/* Sun main glow */}
          <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%"   stopColor="#FFFFFF"  stopOpacity="1" />
            <Stop offset="20%"  stopColor={sunCoreColor} stopOpacity="0.98" />
            <Stop offset="55%"  stopColor={sunColor}  stopOpacity="0.55" />
            <Stop offset="100%" stopColor={sunColor}  stopOpacity="0" />
          </RadialGradient>

          {/* Moon ambient glow */}
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor="#D0E8FF" stopOpacity="0.25" />
            <Stop offset="60%"  stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Sunrise horizon glow — left-bottom radial */}
          <RadialGradient
            id="sunriseGlow"
            cx="0%"
            cy="100%"
            r="60%"
            fx="0%"
            fy="100%"
          >
            <Stop offset="0%"   stopColor="#FF6B00" stopOpacity={sky.sunriseGlow.toFixed(3)} />
            <Stop offset="50%"  stopColor="#FF8C00" stopOpacity={(sky.sunriseGlow * 0.4).toFixed(3)} />
            <Stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </RadialGradient>

          {/* Sunset horizon glow — right-bottom radial */}
          <RadialGradient
            id="sunsetGlow"
            cx="100%"
            cy="100%"
            r="60%"
            fx="100%"
            fy="100%"
          >
            <Stop offset="0%"   stopColor="#CC2200" stopOpacity={sky.sunsetGlow.toFixed(3)} />
            <Stop offset="50%"  stopColor="#FF4400" stopOpacity={(sky.sunsetGlow * 0.4).toFixed(3)} />
            <Stop offset="100%" stopColor="#CC2200" stopOpacity="0" />
          </RadialGradient>

          {/* Atmospheric haze at bottom */}
          <RadialGradient
            id="hazeGradient"
            cx="50%"
            cy="100%"
            r="70%"
            fx="50%"
            fy="100%"
          >
            <Stop offset="0%"   stopColor="#000000" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ---- Stars ---- */}
        {sky.starOpacity > 0 && (
          <G opacity={sky.starOpacity}>
            {STARS.map((star, i) => (
              <Circle
                key={i}
                cx={star.x}
                cy={star.y}
                r={star.r}
                fill="#FFFFFF"
                opacity={star.baseOpacity}
              />
            ))}
          </G>
        )}

        {/* ---- Sunrise horizon glow ---- */}
        {sky.sunriseGlow > 0.01 && (
          <Rect
            x={0}
            y={SCREEN_HEIGHT * 0.55}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT * 0.45}
            fill="url(#sunriseGlow)"
          />
        )}

        {/* ---- Sunset horizon glow ---- */}
        {sky.sunsetGlow > 0.01 && (
          <Rect
            x={0}
            y={SCREEN_HEIGHT * 0.55}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT * 0.45}
            fill="url(#sunsetGlow)"
          />
        )}

        {/* ---- Sun ---- */}
        {sky.sunVisible && (
          <G>
            {/* Outer atmospheric haze ring */}
            <Circle cx={sky.sunX} cy={sky.sunY} r={sunAtmR}  fill="url(#sunAtm)" />
            {/* Main glow */}
            <Circle cx={sky.sunX} cy={sky.sunY} r={sunGlowR} fill="url(#sunGlow)" />
            {/* Solid core */}
            <Circle cx={sky.sunX} cy={sky.sunY} r={sunCoreR} fill={sunCoreColor} opacity={0.97} />
          </G>
        )}

        {/* ---- Moon (crescent via two overlapping circles) ---- */}
        {sky.moonVisible && sky.moonOpacity > 0.01 && (
          <G opacity={sky.moonOpacity}>
            {/* Outer atmospheric glow */}
            <Circle cx={sky.moonX} cy={sky.moonY} r={50} fill="url(#moonGlow)" />
            {/* Moon disc */}
            <Circle cx={sky.moonX} cy={sky.moonY} r={14} fill="#F0EBDF" opacity={0.96} />
            {/* Shadow circle to carve the crescent */}
            <Circle cx={sky.moonX + 5} cy={sky.moonY} r={12} fill="#0A0E2A" opacity={0.96} />
          </G>
        )}

        {/* ---- Atmospheric haze at bottom ---- */}
        <Rect
          x={0}
          y={SCREEN_HEIGHT * 0.72}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT * 0.28}
          fill="url(#hazeGradient)"
        />
      </Svg>

      {/* App content renders on top */}
      {children}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
