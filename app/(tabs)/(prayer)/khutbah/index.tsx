import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { Khutbah } from '../../../../utils/types';
import { fetchKhutbahs } from '../../../../api/firebase/prayer';
import KhutbahCard from '../../../../components/prayer/KhutbahCard';

const KhutbahScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [khutbahs, setKhutbahs] = useState<Khutbah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadKhutbahs = async () => {
      try {
        const data = await fetchKhutbahs();
        setKhutbahs(data);
      } catch (err: any) {
        setError('Failed to load khutbahs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadKhutbahs();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={khutbahs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <KhutbahCard khutbah={item} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.primary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Outfit_500Medium',
      color: theme.colors.text.error,
    },
  });

export default KhutbahScreen;