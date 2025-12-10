/**
 * Expandable Section Component
 * 
 * Smooth animated expandable section with glassmorphism.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome6 } from '@expo/vector-icons';
import { AnimatePresence } from 'moti';

import { useTheme } from '../../context/ThemeContext';

interface ExpandableSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  delay?: number;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  delay = 0,
}) => {
  const { theme } = useTheme();
  
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, delay }}
    >
      <View style={[styles.container, {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.muted,
      }]}>
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, {
              backgroundColor: theme.colors.accent + '15',
            }]}>
              <FontAwesome6 name={icon} size={16} color={theme.colors.accent} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {title}
            </Text>
          </View>
          
          <MotiView
            animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <FontAwesome6
              name="chevron-down"
              size={16}
              color={theme.colors.text.secondary}
            />
          </MotiView>
        </TouchableOpacity>
        
        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <View style={styles.content}>
                {children}
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default ExpandableSection;