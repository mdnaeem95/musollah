import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { proceduresList } from '../../../../data/proceduresList';
import { useTheme } from '../../../../context/ThemeContext';

export default function ProcedureBotLanding() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>Rihlah Procedure Guides</Text>
      <FlatList
        data={proceduresList}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
            <Pressable
            style={[
                styles.card,
                {
                backgroundColor: theme.colors.muted,
                },
            ]}
            onPress={() => router.push(`/procedureBot/${item.slug}`)}
            >
            <Text style={[styles.icon, { color: theme.colors.text.primary }]}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>{item.title}</Text>
                <Text style={[styles.description, { color: theme.colors.text.secondary }]}>{item.description}</Text>
            </View>
            </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 12,
  },
  icon: {
    fontSize: 34,
    marginRight: 16,
  },
  title: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    marginTop: 4,
  },
});