/**
 * Doa (After Prayer Supplications) - Modern Design
 * 
 * Display list of duas to recite after prayer with Arabic text,
 * romanization, and English translation
 * 
 * @version 2.0
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../../context/ThemeContext';
import { useDoa } from '../../../../hooks/prayer/doa/useDoa';
import DoaItem from '../../../../components/prayer/doa/DoaItem';
import DoaListHeader from '../../../../components/prayer/doa/DoaListHeader';
import DoaInfoModal from '../../../../components/prayer/doa/DoaInfoModal';
import { LoadingState, ErrorState } from '../../../../components/prayer/doa/DoaStates';
import type { DoaAfterPrayer } from '../../../../types/doa.types';
import { enter } from '../../../../utils';

/**
 * Main Doa component
 * Displays list of duas to recite after prayer
 * 
 * Features:
 * - Fetches duas from Firebase
 * - Displays Arabic text, romanization, and translation
 * - Info modal with guidance
 * - Staggered animations
 * - Haptic feedback
 * - Optimized FlashList rendering
 */
const Doa: React.FC = () => {
  const { theme } = useTheme();
  const { doas, loading, error, refetch } = useDoa();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleInfoPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(false);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: DoaAfterPrayer; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={enter(0)}
      >
        <DoaItem item={item} index={index} />
      </MotiView>
    ),
    []
  );

  const renderHeader = useCallback(() => (
    <DoaListHeader onInfoPress={handleInfoPress} />
  ), [handleInfoPress]);

  const keyExtractor = useCallback((item: DoaAfterPrayer) => item.id, []);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <LoadingState />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <ErrorState error={error} onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <FlashList
        data={doas}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <DoaInfoModal visible={modalVisible} onClose={handleModalClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
});

export default Doa;