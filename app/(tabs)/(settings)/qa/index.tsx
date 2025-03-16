import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import QuestionList from '../../../../components/QaQuestionList';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../context/ThemeContext';

const LandingPage = () => {
  const router = useRouter();
  const { theme } = useTheme();

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

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header with Search Bar */}
        <View style={styles.headerContainer}>
          {isSearchExpanded && (
            <View style={styles.searchBarContainer}>
              <TextInput
                placeholder="Search questions or content"
                placeholderTextColor={theme.colors.text.muted}
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
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
        <QuestionList searchQuery={debounceQuery} />
      </ScrollView>

      {/* Fixed Ask a Question Button */}
      <View style={styles.buttonRowContainer}>
        {/* Ask a Question Button */}
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => router.push('/qa/newQuestion')}
        >
          <FontAwesome6
            name="question-circle"
            size={18}
            color={theme.colors.text.primary}
            style={styles.icon}
          />
          <Text style={styles.askButtonText}>Ask a Question</Text>
        </TouchableOpacity>

        {/* Ask AI Button */}
        {/* <TouchableOpacity
          style={styles.askButton}
          onPress={() => router.push('/qa/aiChatbot')}
        >
          <FontAwesome6
            name="robot"
            size={18}
            color={theme.colors.text.primary}
            style={styles.icon}
          />
          <Text style={styles.askButtonText}>Ask AI</Text>
        </TouchableOpacity> */}
      </View>

    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
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
      backgroundColor: theme.colors.secondary,
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingVertical: 5,
      shadowColor: theme.colors.text.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      marginRight: 10,
    },
    searchInput: {
      color: theme.colors.text.primary,
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
    aiButtonContainer: {
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 20,
      alignItems: 'center',
    },
    buttonRowContainer: {
      flexDirection: 'row', // Aligns buttons in a row
      justifyContent: 'space-between', // Even spacing
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
    },
    askButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      padding: 15,
      borderRadius: 10,
      shadowColor: theme.colors.text.primary,
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
      flex: 1, // Ensures equal width
      marginHorizontal: 5, // Adds spacing between buttons
    },  
    icon: {
      marginRight: 8,
      color: '#000'
    },
    askButtonText: {
      fontFamily: 'Outfit_600SemiBold',
      color: '#000',
      fontSize: 16,
    },
  });

export default LandingPage;
