import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Khutbah } from '../../utils/types';
import { useTheme } from '../../context/ThemeContext';
import { useTypewriterParagraphs } from '../../hooks/useTypewriterParagraphs';
import * as Clipboard from 'expo-clipboard';

interface Props {
  khutbah: Khutbah;
}

const KhutbahCard = ({ khutbah }: Props) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [expanded, setExpanded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [paragraphs, isTyping] = useTypewriterParagraphs(showSummary ? khutbah.summary || '' : '');

  const handleDownload = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Error opening link', err));
  };

  const handleCopySummary = async () => {
    if (!khutbah.summary) {
      Alert.alert("No Summary", "There's no summary to copy yet.");
      return;
    }
    await Clipboard.setStringAsync(khutbah.summary);
    Alert.alert("Copied!", "Khutbah summary has been copied to clipboard.");
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{khutbah.title}</Text>
          <Text style={styles.date}>{new Date(khutbah.date).toDateString()}</Text>
        </View>
        <FontAwesome6
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>

      {expanded && (
        <>
          {/* Download links */}
          <View style={styles.languageRow}>
            {Object.entries(khutbah.links).map(([lang, url]) => (
              <TouchableOpacity
                key={lang}
                style={styles.downloadButton}
                onPress={() => handleDownload(url!)}
              >
                <FontAwesome6 name="file-arrow-down" size={16} color={theme.colors.text.primary} />
                <Text style={styles.languageText}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Summary section */}
          {khutbah.summary && (
            <View style={styles.summarySection}>
              {showSummary ? (
                <>
                  <View style={styles.summaryWrapper}>
                    {paragraphs.map((line, index) => (
                      <Text
                        key={index}
                        style={[styles.summaryText, index < paragraphs.length - 1 && { marginBottom: 6 }]}
                      >
                        {line}
                        {index === paragraphs.length - 1 && isTyping && (
                          <Text style={styles.cursor}>|</Text>
                        )}
                      </Text>
                    ))}
                  </View>

                  {/* Copy Summary Button */}
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopySummary}>
                    <FontAwesome6 name="copy" size={14} color={theme.colors.text.primary} />
                    <Text style={styles.copyText}>Copy Summary</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.summarizeButton} onPress={() => setShowSummary(true)}>
                  <FontAwesome6 name="robot" size={14} color={theme.colors.text.primary} />
                  <Text style={styles.summarizeText}>Generate Summary</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginBottom: theme.spacing.medium,
      minHeight: 90,
      justifyContent: 'space-between',
      ...theme.shadows.default,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontFamily: 'Outfit_600SemiBold',
      fontSize: 16,
      color: theme.colors.text.primary,
    },
    date: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    languageRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: theme.spacing.small,
      flexWrap: 'wrap',
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.muted,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.small,
      gap: 6,
    },
    languageText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 13,
      color: theme.colors.text.primary,
    },
    summarySection: {
      marginTop: theme.spacing.small,
    },
    summarizeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.muted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.small,
    },
    summarizeText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: theme.colors.text.primary,
    },
    summaryWrapper: {
      marginTop: theme.spacing.small,
    },
    summaryText: {
      fontFamily: 'Outfit_400Regular',
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    cursor: {
      fontWeight: 'bold',
      color: theme.colors.text.secondary,
      marginLeft: 2,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.small,
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.muted,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.small,
      gap: 6,
    },
    copyText: {
      fontFamily: 'Outfit_500Medium',
      fontSize: 13,
      color: theme.colors.text.primary,
    },
  });

export default KhutbahCard;