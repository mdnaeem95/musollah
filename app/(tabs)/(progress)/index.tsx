/**
 * Progress — unified "spiritual progress" surface.
 *
 * A calm, glanceable overview of prayer consistency, Quran reading, the Khatam
 * plan, and community. Pure aggregation over existing hooks — no new backend.
 * Tasteful encouragement, never guilt.
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { format, subDays } from 'date-fns';

import { useTheme } from '../../../context/ThemeContext';
import { useAccent } from '../../../hooks/useAccent';
import { useAuthStore } from '../../../stores/useAuthStore';
import { LOGGABLE_PRAYERS } from '../../../api/services/prayer';
import {
  usePrayerStats,
  useTodayPrayerLog,
  useWeeklyPrayerLogs,
} from '../../../api/services/prayer/queries/prayer-logs';
import {
  useReadingStreak,
  useRecitationPlan,
  calculateRecitationProgress,
} from '../../../stores/useQuranStore';
import { useTasbihToday } from '../../../stores/useTasbihStore';
import SignInModal from '../../../components/SignInModal';
import { enter } from '../../../utils';

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// Display labels for the five loggable prayers (under the today dots).
const PRAYER_SHORT: Record<string, string> = {
  Subuh: 'Subuh',
  Zohor: 'Zohor',
  Asar: 'Asar',
  Maghrib: 'Maghrib',
  Isyak: 'Isyak',
};

// ---------------------------------------------------------------------------
// Card shell
// ---------------------------------------------------------------------------

const Card: React.FC<{ children: React.ReactNode; isDarkMode: boolean; delay?: number; onPress?: () => void }> = ({
  children,
  isDarkMode,
  delay = 0,
  onPress,
}) => {
  const inner = (
    <BlurView
      intensity={isDarkMode ? 18 : 22}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[styles.card, {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)',
      }]}
    >
      {children}
    </BlurView>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360, delay }}
    >
      {onPress ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress}>{inner}</TouchableOpacity>
      ) : (
        inner
      )}
    </MotiView>
  );
};

const SectionLabel: React.FC<{ icon: string; label: string; accent: string; muted: string }> = ({ icon, label, accent, muted }) => (
  <View style={styles.sectionLabelRow}>
    <FontAwesome6 name={icon} size={12} color={accent} />
    <Text style={[styles.sectionLabel, { color: muted }]}>{label}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProgressScreen() {
  const { theme, isDarkMode } = useTheme();
  const { accent } = useAccent();
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? null;
  const [showSignIn, setShowSignIn] = useState(false);

  const textPrimary = theme.colors.text.primary;
  const textSecondary = theme.colors.text.secondary;
  const textMuted = theme.colors.text.muted;

  // ---- Prayer ----
  const { data: prayerStats } = usePrayerStats(userId);
  const { data: todayLog } = useTodayPrayerLog(userId);

  const weekRange = useMemo(() => ({
    start: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  }), []);
  const { data: weeklyLogs } = useWeeklyPrayerLogs(userId, weekRange.start, weekRange.end);

  const todayPrayers = todayLog?.prayers;
  const todayLogged = useMemo(
    () => LOGGABLE_PRAYERS.filter((p) => todayPrayers?.[p] === true).length,
    [todayPrayers]
  );
  const nextUnlogged = useMemo(
    () => LOGGABLE_PRAYERS.find((p) => !todayPrayers?.[p]),
    [todayPrayers]
  );

  const weekDays = useMemo(() => {
    const out: { key: string; label: string; logged: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, 'yyyy-MM-dd');
      const prayers = weeklyLogs?.[key];
      const logged = prayers ? LOGGABLE_PRAYERS.filter((p) => prayers[p] === true).length : 0;
      out.push({ key, label: format(d, 'EEEEE'), logged });
    }
    return out;
  }, [weeklyLogs]);

  // ---- Quran ----
  const reading = useReadingStreak();
  const plan = useRecitationPlan();
  const planProgress = useMemo(() => (plan ? calculateRecitationProgress(plan) : null), [plan]);

  // ---- Dhikr (tasbih) ----
  const dhikrToday = useTasbihToday();

  // ---- Gentle nudge ----
  const nudge = useMemo(() => {
    if (!userId) return "Sign in to track your prayers and build a streak.";
    if (todayLogged >= 5) return "All five prayers logged today — masha'Allah.";
    if (nextUnlogged) return `Next up: ${nextUnlogged}. Log it once you've prayed.`;
    return "Log today's prayers to start your streak.";
  }, [userId, todayLogged, nextUnlogged]);

  const gradientColors = isDarkMode
    ? (['#060B18', '#0C1428', '#080F1E'] as const)
    : (['#EEF2FF', '#F0F4FF', '#E8EFFF'] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Today ---- */}
        <Card isDarkMode={isDarkMode} delay={0}>
          <SectionLabel icon="sun" label="TODAY" accent={accent} muted={textMuted} />

          <View style={styles.todayHeader}>
            <Text style={[styles.todayCount, { color: textPrimary }]}>
              {userId ? `${todayLogged}` : '—'}
              <Text style={[styles.todayCountTotal, { color: textMuted }]}>{userId ? ' / 5' : ''}</Text>
            </Text>
            <Text style={[styles.todayCaption, { color: textSecondary }]}>prayers logged</Text>
          </View>

          {/* Five prayer dots */}
          <View style={styles.prayerDots}>
            {LOGGABLE_PRAYERS.map((p) => {
              const done = todayPrayers?.[p] === true;
              return (
                <View key={p} style={styles.prayerDot}>
                  <View
                    style={[
                      styles.dotCircle,
                      done
                        ? { backgroundColor: accent, borderColor: accent }
                        : { backgroundColor: 'transparent', borderColor: textMuted + '66' },
                    ]}
                  >
                    {done && <FontAwesome6 name="check" size={11} color="#fff" />}
                  </View>
                  <Text style={[styles.dotLabel, { color: done ? accent : textMuted }]} numberOfLines={1}>
                    {PRAYER_SHORT[p]}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Gentle nudge */}
          <View style={[styles.nudge, { backgroundColor: accent + '14' }]}> 
            <Text style={[styles.nudgeText, { color: textSecondary }]}>{nudge}</Text>
          </View>

          {!userId ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accent }]}
              activeOpacity={0.85}
              onPress={() => setShowSignIn(true)}
            >
              <FontAwesome6 name="right-to-bracket" size={14} color="#fff" />
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => router.push('/prayerDashboard')}>
              <Text style={[styles.linkText, { color: accent }]}>Open prayer log</Text>
              <FontAwesome6 name="chevron-right" size={11} color={accent} />
            </TouchableOpacity>
          )}
        </Card>

        {/* ---- Prayer streak + weekly strip ---- */}
        <Card isDarkMode={isDarkMode} delay={60}>
          <SectionLabel icon="fire" label="PRAYER CONSISTENCY" accent={accent} muted={textMuted} />

          <View style={styles.streakRow}>
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: textPrimary }]}>{prayerStats?.currentStreak ?? 0}</Text>
              <Text style={[styles.streakLabel, { color: textMuted }]}>day streak</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: textMuted + '33' }]} />
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: textPrimary }]}>{prayerStats?.longestStreak ?? 0}</Text>
              <Text style={[styles.streakLabel, { color: textMuted }]}>longest</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: textMuted + '33' }]} />
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: textPrimary }]}>{prayerStats?.completionRate ?? 0}%</Text>
              <Text style={[styles.streakLabel, { color: textMuted }]}>completion</Text>
            </View>
          </View>

          {/* Last 7 days */}
          <View style={styles.weekStrip}>
            {weekDays.map((d, i) => {
              const ratio = d.logged / 5;
              const bg =
                ratio >= 1 ? accent : ratio > 0 ? accent + '55' : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)');
              return (
                <View key={d.key} style={styles.weekDay}>
                  <View style={[styles.weekCell, { backgroundColor: bg }]}>
                    {ratio >= 1 && <FontAwesome6 name="check" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.weekLabel, { color: i === 6 ? accent : textMuted }]}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ---- Quran ---- */}
        <Card isDarkMode={isDarkMode} delay={120} onPress={() => router.push('/recitationPlan')}>
          <SectionLabel icon="book-quran" label="QURAN" accent={accent} muted={textMuted} />

          <View style={styles.quranRow}>
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: textPrimary }]}>{reading.currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: textMuted }]}>reading streak</Text>
            </View>
            <View style={[styles.streakDivider, { backgroundColor: textMuted + '33' }]} />
            <View style={styles.streakStat}>
              <Text style={[styles.streakValue, { color: textPrimary }]}>{reading.totalCount}</Text>
              <Text style={[styles.streakLabel, { color: textMuted }]}>ayahs read</Text>
            </View>
          </View>

          {plan && planProgress ? (
            <View style={styles.planBlock}>
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, { color: textSecondary }]}>
                  Khatam plan · {plan.planType}
                </Text>
                <Text style={[styles.planPct, { color: accent }]}>
                  {Math.round(planProgress.progressRatio * 100)}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)' }]}>
                <View
                  style={[styles.progressFill, {
                    backgroundColor: accent,
                    width: `${Math.min(100, Math.round(planProgress.progressRatio * 100))}%`,
                  }]}
                />
              </View>
              <Text style={[styles.planMeta, { color: textMuted }]}>
                {planProgress.completed} done · day {planProgress.daysPassed} of {plan.daysToFinish}
              </Text>
            </View>
          ) : (
            <View style={styles.linkRow}>
              <Text style={[styles.linkText, { color: accent }]}>Start a Khatam plan</Text>
              <FontAwesome6 name="chevron-right" size={11} color={accent} />
            </View>
          )}
        </Card>

        {/* ---- Dhikr / Tasbih ---- */}
        <Card isDarkMode={isDarkMode} delay={180} onPress={() => router.push('/tasbih')}>
          <View style={styles.navRow}>
            <View style={[styles.navIcon, { backgroundColor: accent + '15' }]}>
              <FontAwesome6 name="hand-holding-heart" size={18} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.navTitle, { color: textPrimary }]}>Tasbih</Text>
              <Text style={[styles.navSub, { color: textMuted }]}>
                {dhikrToday > 0 ? `${dhikrToday} dhikr today` : 'Count your dhikr'}
              </Text>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={textMuted} />
          </View>
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>

      <SignInModal visible={showSignIn} onClose={() => setShowSignIn(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.2,
  },

  // Today
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  todayCount: {
    fontSize: 40,
    fontFamily: 'Outfit_700Bold',
    lineHeight: 44,
  },
  todayCountTotal: {
    fontSize: 22,
    fontFamily: 'Outfit_500Medium',
  },
  todayCaption: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
  prayerDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  prayerDot: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dotCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 46,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },

  // Streak stats
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  quranRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  streakValue: {
    fontSize: 26,
    fontFamily: 'Outfit_700Bold',
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
  },
  streakDivider: {
    width: 1,
    height: 32,
  },

  // Week strip
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  weekCell: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
  },

  // Quran plan
  planBlock: {
    gap: SPACING.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'capitalize',
  },
  planPct: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  planMeta: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },

  // Nav card (Tasbih)
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
  navSub: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    marginTop: 2,
  },
});
