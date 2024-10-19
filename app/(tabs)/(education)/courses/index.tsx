import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import React, { useLayoutEffect, useState } from 'react';
import { Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import CourseCard from '../../../../components/CourseCard';
import { CourseData } from '../../../../utils/types';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrayerHeader from '../../../../components/PrayerHeader';
import { FontAwesome6 } from '@expo/vector-icons';
import { CheckBox } from '@rneui/base';

const categories = [
  { title: 'All Courses' },
  { title: 'Prayers' },
  { title: 'Quran' },
  { title: 'Fardu Ain' },
  { title: 'Akhlaq' },
  { title: 'Modern Challenges' },
];

const EducationTab = () => {
  const { courses } = useSelector((state: RootState) => state.dashboard);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation();
  const [selectedTypes, setSelectedTypes] = useState({
    'Online': true,
    'Physical': false,
  });
  
  const [selectedCategories, setSelectedCategories] = useState({
    'All Courses': true,
    'Prayers': false,
    'Quran': false,
    'Fardu Ain': false,
    'Akhlaq': false,
    'Modern Challenges': false,
  });

    // Handle course type selection
    const handleTypeSelection = (type: string) => {
      setSelectedTypes((prev: any) => ({
        ...prev,
        [type]: !prev[type],
      }));
    };
  
    // Handle category selection
    const handleCategorySelection = (category: string) => {
      setSelectedCategories((prev: any) => ({
        ...prev,
        [category]: !prev[category],
      }));
    };

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  const toggleFilterModal = () => setIsFilterModalVisible(!isFilterModalVisible);

  const filteredCourses = courses.filter((course) => {
    // Check if the category is selected
    const matchesCategory =
      // @ts-ignore
      selectedCategories['All Courses'] || selectedCategories[course.category];
  
    // Check if the course type (online/physical) is selected
    const matchesType = selectedTypes[course.type === 'online' ? 'Online' : 'Physical'];
  
    // Check if the search query matches either the title or the description
    const matchesSearchQuery =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
  
    // Return true if all conditions are met
    return matchesCategory && matchesType && matchesSearchQuery;
  });
  

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Header */}
      <PrayerHeader title="Courses" backgroundColor="#4D6561" />

      {/* Search Bar */}
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View style={styles.searchBarContainer}>
            <TextInput 
              placeholder='Search Course...'
              placeholderTextColor="#B0B0B0"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery} 
            />
          </View>
        )}
        <TouchableOpacity onPress={toggleSearch} >
          <FontAwesome6 
            name={isSearchExpanded ? 'xmark' : 'magnifying-glass'} 
            size={24} 
            color={'#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Filter Button */}
      <TouchableOpacity style={styles.filterButton} onPress={toggleFilterModal}>
        <Text style={styles.filterButtonText}>Filter Courses</Text>
      </TouchableOpacity>

      {/* Modal for filters */}
      <Modal visible={isFilterModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%' }}>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} style={{ left: -30 }}>
                <FontAwesome6 name="xmark" size={20} />
              </TouchableOpacity>
              <Text style={styles.modalHeader}>Filter Courses</Text>
              <View style={{ width: 20, height: 20 }} />
            </View>

            {/* Course Type Filter */}
            <Text style={styles.filterLabel}>Course Type</Text>
            <View style={styles.optionContainer}>
              <CheckBox
                title="Online"
                checked={selectedTypes.Online}
                onPress={() => handleTypeSelection('Online')}
              />
              <CheckBox
                title="Physical"
                checked={selectedTypes.Physical}
                onPress={() => handleTypeSelection('Physical')}
              />
            </View>

            {/* Course Category Filter */}
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.optionContainer}>
              {categories.map((category) => (
                <CheckBox
                  key={category.title}
                  title={category.title}
                  // @ts-ignore
                  checked={selectedCategories[category.title]}
                  onPress={() => handleCategorySelection(category.title)}
                />
              ))}
            </View>

            {/* Apply Filters Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setIsFilterModalVisible(false);
                // Logic for applying the filters can be handled here
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Divider style={{ marginVertical: 10 }} />

      {/* Courses */}
      <FlatList
        data={filteredCourses}
        renderItem={({ item }: { item: CourseData }) => (
          <CourseCard
            id={item.id}
            title={item.title}
            description={item.description}
            category={item.category}
            icon={item.icon}
            backgroundColour={item.backgroundColour}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.coursesContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4D6561',
    paddingBottom: 8,
    marginBottom: 10,
  },  
  searchBarContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchInput: {
    color: 'black',
    fontSize: 18,
    height: 40,
    fontFamily: 'Outfit_400Regular',
  },
  coursesContainer: {
    paddingBottom: 100,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Outfit_500Medium',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold'
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    marginVertical: 10,
  },
  optionContainer: {
    width: '100%',
    marginBottom: 15,
  },
  applyButton: {
    backgroundColor: '#A3C0BB',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Outfit_400Regular'
  },
});

export default EducationTab;
