/**
 * Fasting Timeline
 *
 * Visual horizontal bar showing Imsak to Maghrib
 * with a current time indicator dot.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface FastingTimelineProps {
  imsakTime: string | null;
  iftarTime: string | null;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

const FastingTimeline: React.FC<FastingTimelineProps> = ({
  imsakTime,
  iftarTime,
}) => {
  const { theme } = useTheme();
  const [currentMinutes, setCurrentMinutes] = useState(nowMinutes());

  useEffect(() => {
    const interval = setInterval(() => setCurrentMinutes(nowMinutes()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const imsak = imsakTime ? timeToMinutes(imsakTime) : null;
  const iftar = iftarTime ? timeToMinutes(iftarTime) : null;

  const progress = useMemo(() => {
    if (imsak == null || iftar == null || iftar <= imsak) return null;
    const totalSpan = iftar - imsak;
    const elapsed = currentMinutes - imsak;
    if (elapsed <= 0) return 0;
    if (elapsed >= totalSpan) return 1;
    return elapsed / totalSpan;
  }, [imsak, iftar, currentMinutes]);

  if (!imsakTime || !iftarTime || progress === null) return null;

  const isFasting = progress > 0 && progress < 1;
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <View style={styles.labelItem}>
          <FontAwesome6 name="cloud-moon" size={11} color="rgba(255,255,255,0.5)" />
          <Text style={styles.labelText}>Imsak</Text>
          <Text style={styles.labelTime}>{imsakTime}</Text>
        </View>
        {isFasting && (
          <Text style={styles.fastingLabel}>Fasting</Text>
        )}
        <View style={[styles.labelItem, { alignItems: 'flex-end' }]}>
          <FontAwesome6 name="sun" size={11} color="rgba(255,255,255,0.5)" />
          <Text style={styles.labelText}>Iftar</Text>
          <Text style={styles.labelTime}>{iftarTime}</Text>
        </View>
      </View>

      <View style={styles.trackOuter}>
        <View
          style={[
            styles.trackFilled,
            { width: `${Math.min(progress * 100, 100)}%` },
          ]}
        />
        {isFasting && (
          <View
            style={[
              styles.indicator,
              { left: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: 14,
      marginTop: 16,
      width: '100%',
    },
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    labelItem: {
      gap: 2,
    },
    labelText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
    },
    labelTime: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 14,
      color: '#FFFFFF',
    },
    fastingLabel: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 11,
      color: '#FFD700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      alignSelf: 'center',
    },
    trackOuter: {
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.1)',
      overflow: 'visible',
      position: 'relative',
    },
    trackFilled: {
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FFD700',
    },
    indicator: {
      position: 'absolute',
      top: -4,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#FFD700',
      borderWidth: 2,
      borderColor: '#1a1a2e',
      marginLeft: -7,
    },
  });

export default FastingTimeline;
