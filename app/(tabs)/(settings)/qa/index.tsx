import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import QuestionList from '../../../../components/QaQuestionList';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const LandingPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setSearchQuery(''); // Reset search when closing
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header with Search Bar */}
        <View style={styles.headerContainer}>
          {isSearchExpanded && (
            <View style={styles.searchBarContainer}>
              <TextInput
                placeholder="Search questions or content"
                placeholderTextColor="#B0B0B0"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          )}

          <TouchableOpacity onPress={toggleSearch} style={styles.searchIconContainer}>
            <FontAwesome6 
              name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} 
              size={24} 
              color="#ECDFCC" 
            />
          </TouchableOpacity>
        </View>
        <QuestionList searchQuery={debounceQuery} />
      </ScrollView>

      {/* Fixed Ask a Question Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => router.push("/qa/newQuestion")}
        >
          <FontAwesome6 name="question-circle" size={18} color="#FFF" style={styles.icon} />
          <Text style={styles.askButtonText}>Ask a Question</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
  },
  scrollContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flex: 1,
    backgroundColor: '#3A504C',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginRight: 10,
  },
  searchInput: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
  },
  searchIconContainer: {
    padding: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A3C0BB',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  icon: {
    marginRight: 8,
  },
  askButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    fontSize: 16,
  },
});

export default LandingPage;
