import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { FlashList } from '@shopify/flash-list';

const businessData = [
  {
    id: '1',
    name: 'Makan Best Bites',
    category: 'F&B',
    tags: ['Halal Certified'],
    location: 'Bugis, Central SG',
    image: "",
  },
  {
    id: '2',
    name: 'Noor Apparel',
    category: 'Fashion',
    tags: [],
    location: 'Tampines, East SG',
    image: "",
  },
  // Add more sample businesses
];

export default function MoeIndexScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');

  const filteredData = businessData.filter(biz =>
    biz.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.secondary }]}> 
      <Image source={item.image} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.colors.text.primary }]}>{item.name}</Text>
        <View style={styles.tagRow}>
          <Text style={styles.tag}>{item.category}</Text>
          {item.tags.map((tag: any) => (
            <Text key={tag} style={[styles.tag, styles.tagSecondary]}>{tag}</Text>
          ))}
        </View>
        <Text style={[styles.location, { color: theme.colors.text.secondary }]}>{item.location}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity><Text style={styles.link}>Visit</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.link}>Map</Text></TouchableOpacity>
        </View>
      </View>
      <FontAwesome name="heart-o" size={20} color={theme.colors.text.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}> 
      <Text style={[styles.header, { color: theme.colors.text.primary }]}>Muslim-Owned Businesses</Text>
      <Text style={[styles.subheader, { color: theme.colors.text.secondary }]}>Verified by SMCCI & MuslimOwnedSG</Text>
      <TextInput
        style={[styles.search, { backgroundColor: theme.colors.muted, color: theme.colors.text.primary }]}
        placeholder="Search businesses..."
        placeholderTextColor={theme.colors.text.secondary}
        value={search}
        onChangeText={setSearch}
      />
      <FlashList
        data={filteredData}
        estimatedItemSize={103}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  subheader: {
    fontSize: 14,
    marginBottom: 12,
  },
  search: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  listContent: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  location: {
    fontSize: 13,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: 11,
    backgroundColor: '#EEE',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagSecondary: {
    backgroundColor: '#DDEED8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  link: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F3C88',
  },
});
