/**
 * Stat Pill Component (UPDATED)
 * 
 * Better spacing and touch targets.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';

interface StatPillProps {
  icon: string;
  label: string;
  delay?: number;
}

const StatPill: React.FC<StatPillProps> = ({ icon, label, delay = 0 }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      delay={delay}
      style={styles.container}
    >
      <FontAwesome6 name={icon} size={12} color="#fff" />
      <Text style={styles.label}>{label}</Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, // Increased from 10
    paddingVertical: 8, // Increased from 6
    borderRadius: 16,
    gap: 8, // Increased from 6
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    color: '#fff',
    fontSize: 12, // Increased from 11
    fontFamily: 'Outfit_600SemiBold',
  },
});

export default StatPill;