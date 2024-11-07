import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import CourseCard from '../../../../components/CourseCard';
import { CourseData } from '../../../../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';
import { CheckBox } from '@rneui/base';
import { FlashList } from '@shopify/flash-list';

const categories = [
  { title: 'All Courses' },
  { title: 'Prayers' },
  { title: 'Quran' },
  { title: 'Fardu Ain' },
  { title: 'Akhlaq' },
  { title: 'Modern Challenges' },
];

const Courses = () => {
  const { courses } = useSelector((state: RootState) => state.dashboard);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debounceQuery, setDebounceQuery] = useState<string>(searchQuery);
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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
}

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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
    <View style={styles.mainContainer}>
      {/* Search Bar */}
      {/* Header with expandable search bar */}
      <View style={styles.headerContainer}>
          {isSearchExpanded && (
              <View style={styles.searchBarContainer}>
                  <TextInput
                      placeholder="Search Course"
                      placeholderTextColor="#ECDFCC"
                      style={styles.searchInput}
                      value={searchQuery}
                      onChangeText={handleSearchChange}
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
                <FontAwesome6 name="xmark" size={20} color="#FFFFFF" />
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
                containerStyle={{ backgroundColor: '#3A504C' }}
                fontFamily='Outfit_400Regular'
                textStyle={{ color: '#ECDFCC' }}
                onPress={() => handleTypeSelection('Online')}
              />
              <CheckBox
                title="Physical"
                containerStyle={{ backgroundColor: '#3A504C' }}
                fontFamily='Outfit_400Regular'
                textStyle={{ color: '#ECDFCC' }}
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
                  containerStyle={{ backgroundColor: '#3A504C' }}
                  fontFamily='Outfit_400Regular'
                  textStyle={{ color: '#ECDFCC' }}
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
      <FlashList
        estimatedItemSize={108}
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
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    paddingHorizontal: 16,
  },
  headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10
  },
  searchBarContainer: {
      flex: 1,
      backgroundColor: '#3A504C',
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      marginRight: 10,
  },
  searchInput: {
      color: '#ECDFCC',
      fontFamily: 'Outfit_400Regular',
      fontSize: 16,
  },
  searchIconContainer: {
      padding: 8,
  },
  coursesContainer: {
    paddingBottom: 100,
  },
  filterButton: {
    backgroundColor: '#A3C0BB', 
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButtonText: {
    fontSize: 16,
    color: '#FFFFFF', // Light color for the text
    fontFamily: 'Outfit_500Medium',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#3A504C',
    padding: 20,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#ECDFCC',
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

export default Courses;
