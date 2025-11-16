import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { useDoa } from '../../../../hooks/prayer/doa/useDoa';
import DoaItem from '../../../../components/prayer/doa/DoaItem';
import DoaListHeader from '../../../../components/prayer/doa/DoaListHeader';
import DoaInfoModal from '../../../../components/prayer/doa/DoaInfoModal';
import { LoadingState, ErrorState } from '../../../../components/prayer/doa/DoaStates';
import type { DoaAfterPrayer } from '../../../../types/doa.types';

/**
 * Main Doa component
 * Displays list of duas to recite after prayer
 * 
 * Features:
 * - Fetches duas from Firebase
 * - Displays Arabic text, romanization, and translation
 * - Info modal with guidance
 * - Error handling and retry
 * - Optimized FlatList rendering
 */
const Doa: React.FC = () => {
  const { theme } = useTheme();
  const { doas, loading, error, refetch } = useDoa();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleInfoPress = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const renderItem = useCallback(({ item }: { item: DoaAfterPrayer }) => (
    <DoaItem
      item={item}
      textColor={theme.colors.text.primary}
      secondaryColor={theme.colors.text.secondary}
      mutedColor={theme.colors.text.muted}
    />
  ), [theme.colors.text]);

  const renderHeader = useCallback(() => (
    <DoaListHeader
      onInfoPress={handleInfoPress}
      backgroundColor={theme.colors.secondary}
      iconColor={theme.colors.text.primary}
    />
  ), [handleInfoPress, theme.colors.secondary, theme.colors.text.primary]);

  const keyExtractor = useCallback((item: DoaAfterPrayer) => item.id, []);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <LoadingState color={theme.colors.text.muted} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
        <ErrorState
          error={error}
          onRetry={refetch}
          textColor={theme.colors.text.primary}
          buttonColor={theme.colors.secondary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <FlatList
        data={doas}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
      />

      <DoaInfoModal
        visible={modalVisible}
        onClose={handleModalClose}
        backgroundColor={theme.colors.secondary}
        textColor={theme.colors.text.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
});

export default Doa;