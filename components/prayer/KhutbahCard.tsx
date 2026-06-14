import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { useTypewriterParagraphs } from '../../hooks/prayer/khutbah/useTypewriterParagraphs';
import * as Clipboard from 'expo-clipboard';
import { Khutbah } from '../../api/services/khutbah';
import { createLogger } from '../../services/logging/logger';

const logger = createLogger('Khutbah');

interface Props {
  khutbah: Khutbah;
}

const KhutbahCard = ({ khutbah }: Props) => {
  const { theme, isDarkMode } = useTheme();

  const [expanded, setExpanded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [paragraphs, isTyping] = useTypewriterParagraphs(showSummary ? khutbah.summary || '' : '');

  const handleDownload = (url: string) => {
    Linking.openURL(url).catch((err) => logger.error('Error opening link', err as Error));
  };

  const handleCopySummary = async () => {
    if (!khutbah.summary) {
      Alert.alert("No Summary", "There's no summary to copy yet.");
      return;
    }
    await Clipboard.setStringAsync(khutbah.summary);
    Alert.alert("Copied!", "Khutbah summary has been copied to clipboard.");
  };

  const textPrimary = isDarkMode ? 'rgba(255,255,255,0.92)' : theme.colors.text.primary;
  const textSecondary = isDarkMode ? 'rgba(255,255,255,0.45)' : theme.colors.text.secondary;
  const glassBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.88)';
  const glassBorder = isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)';
  const chipBg = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const chipBorder = isDarkMode ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.07)';

  return (
    <BlurView
      intensity={20}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[styles.card, { backgroundColor: glassBg, borderColor: glassBorder }]}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.headerRow}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textPrimary }]}>{khutbah.title}</Text>
          <Text style={[styles.date, { color: textSecondary }]}>
            {new Date(khutbah.date).toDateString()}
          </Text>
        </View>
        <View style={[styles.chevronBadge, { backgroundColor: chipBg, borderColor: chipBorder }]}>
          <FontAwesome6
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={isDarkMode ? 'rgba(255,255,255,0.55)' : theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]} />

          {/* Download links */}
          <View style={styles.languageRow}>
            {Object.entries(khutbah.links).map(([lang, url]) => (
              <TouchableOpacity
                key={lang}
                style={[styles.downloadChip, { backgroundColor: chipBg, borderColor: chipBorder }]}
                onPress={() => handleDownload(url!)}
                activeOpacity={0.7}
              >
                <FontAwesome6 name="file-arrow-down" size={13} color={theme.colors.accent} />
                <Text style={[styles.languageText, {
                  color: isDarkMode ? 'rgba(255,255,255,0.75)' : theme.colors.text.primary,
                }]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary section */}
          {khutbah.summary && (
            <View style={styles.summarySection}>
              {showSummary ? (
                <>
                  <View style={[styles.summaryWrapper, {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                  }]}>
                    {paragraphs.map((line, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.summaryText,
                          { color: isDarkMode ? 'rgba(255,255,255,0.60)' : theme.colors.text.secondary },
                          index < paragraphs.length - 1 && { marginBottom: 8 },
                        ]}
                      >
                        {line}
                        {index === paragraphs.length - 1 && isTyping && (
                          <Text style={{ color: theme.colors.accent }}>|</Text>
                        )}
                      </Text>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.actionChip, { backgroundColor: chipBg, borderColor: chipBorder }]}
                    onPress={handleCopySummary}
                    activeOpacity={0.7}
                  >
                    <FontAwesome6 name="copy" size={13} color={theme.colors.accent} />
                    <Text style={[styles.actionChipText, {
                      color: isDarkMode ? 'rgba(255,255,255,0.70)' : theme.colors.text.primary,
                    }]}>
                      Copy Summary
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionChip, {
                    backgroundColor: theme.colors.accent + '15',
                    borderColor: theme.colors.accent + '35',
                  }]}
                  onPress={() => setShowSummary(true)}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="robot" size={13} color={theme.colors.accent} />
                  <Text style={[styles.actionChipText, { color: theme.colors.accent }]}>
                    AI Summary
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  date: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    marginTop: 3,
  },
  chevronBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 18,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    paddingTop: 14,
  },
  downloadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  languageText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  summaryWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  summaryText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionChipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
  },
});

export default KhutbahCard;
