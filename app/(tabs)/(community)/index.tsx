import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const events = [
  { id: '1', title: 'Islamic Talk: Strengthening Faith', date: 'March 20, 2025', location: 'Masjid Sultan' },
  { id: '2', title: 'Ramadan Charity Drive', date: 'March 25, 2025', location: 'Darul Arqam' },
];

const CommunityScreen = () => {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Upcoming Events</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/community/event-details?id=${item.id}`)}
            style={{ padding: 15, backgroundColor: '#f4f4f4', marginVertical: 5, borderRadius: 8 }}
          >
            <Text style={{ fontSize: 18 }}>{item.title}</Text>
            <Text style={{ color: 'gray' }}>{item.date} • {item.location}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default CommunityScreen;
