import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useLayoutEffect, useState } from 'react';
import { Searchbar } from 'react-native-paper';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import BackArrow from '../../../../components/BackArrow';
import CourseCard from '../../../../components/CourseCard';
import { CourseData } from '../../../../utils/types';
import { useNavigation } from 'expo-router';

const categories = [
  { icon: '', title: 'All Courses' },
  { icon: '', title: 'Prayers' },
  { icon: '', title: 'Quran' },
  { icon: '', title: 'Fardu Ain' },
  { icon: '', title: 'Rihlah' },
  { icon: '', title: 'Taufiq' },
];

const EducationTab = () => {
  const { courses } = useSelector((state: RootState) => state.dashboard);
  const [activeCategory, setActiveCategory] = useState<string>('All Courses');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('Online');
  const navigation = useNavigation();

  const handleCategoryPress = (title: string) => setActiveCategory(title);
  const handleSearchChange = (query: string) => setSearchQuery(query);
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation])

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = activeCategory === 'All Courses' || course.category === activeCategory;
    const matchesSearchQuery = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === 'Online' ? course.type === 'online' : course.type === 'physical';

    return matchesCategory && matchesSearchQuery && matchesSegment;
  });

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <BackArrow />
        <Text style={styles.headerText}>Courses</Text>
      </View>

      {/* Search Bar */}
      <Searchbar
        style={styles.searchBar}
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder="Search courses"
      />

      {/* Segmented Control */}
      <SegmentedControl
        style={styles.segmentedControl}
        values={['Online', 'Physical']}
        selectedIndex={selectedSegment === 'Online' ? 0 : 1}
        onChange={(event) => setSelectedSegment(event.nativeEvent.value)}
      />

      {/* Categories */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                item.title === activeCategory && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategoryPress(item.title)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  item.title === activeCategory && styles.categoryButtonTextActive,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#4D6561',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  segmentedControl: {
    marginBottom: 20,
    backgroundColor: '#A3C0BB',
    borderRadius: 10,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#C3F0E9',
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#333333',
  },
  categoryButtonTextActive: {
    color: '#000000',
  },
  coursesContainer: {
    paddingBottom: 100,
  },
});

export default EducationTab;
