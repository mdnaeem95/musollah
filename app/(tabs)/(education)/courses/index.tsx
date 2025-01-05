import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store/store';
import CourseCard from '../../../../components/education/CourseCard';
import { CourseData } from '../../../../utils/types';
import { FontAwesome6 } from '@expo/vector-icons';
import { CheckBox } from '@rneui/base';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '../../../../context/ThemeContext';

const categories = [
  { title: 'All Courses' },
  { title: 'Prayers' },
  { title: 'Quran' },
  { title: 'Fardu Ain' },
  { title: 'Akhlaq' },
  { title: 'Modern Challenges' },
];

const Courses = () => {
  const { theme } = useTheme();

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

  const handleTypeSelection = (type: string) => {
    setSelectedTypes((prev: any) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleCategorySelection = (category: string) => {
    setSelectedCategories((prev: any) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSearchChange = (query: string) => setSearchQuery(query);

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) setSearchQuery('');
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebounceQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const toggleFilterModal = () => setIsFilterModalVisible(!isFilterModalVisible);

  const filteredCourses = courses.filter((course) => {
    //@ts-ignore
    const matchesCategory = selectedCategories['All Courses'] || selectedCategories[course.category];
    const matchesType = selectedTypes[course.type === 'online' ? 'Online' : 'Physical'];
    const matchesSearchQuery =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesType && matchesSearchQuery;
  });

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.headerContainer}>
        {isSearchExpanded && (
          <View
            style={[
              styles.searchBarContainer,
              { backgroundColor: theme.colors.secondary },
            ]}
          >
            <TextInput
              placeholder="Search Course"
              placeholderTextColor={theme.colors.text.secondary}
              style={[
                styles.searchInput,
                { color: theme.colors.text.primary },
              ]}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>
        )}
        <TouchableOpacity onPress={toggleSearch} style={styles.searchIconContainer}>
          <FontAwesome6
            name={isSearchExpanded ? 'xmark' : 'magnifying-glass'}
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: theme.colors.accent }]}
        onPress={toggleFilterModal}
      >
        <Text
          style={[
            styles.filterButtonText,
            { color: theme.colors.text.primary },
          ]}
        >
          Filter Courses
        </Text>
      </TouchableOpacity>

      <Modal visible={isFilterModalVisible} transparent animationType="slide">
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.modalBackground },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.secondary },
            ]}
          >
            <View style={styles.modalHeaderContainer}>
              <TouchableOpacity onPress={toggleFilterModal}>
                <FontAwesome6 name="xmark" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.modalHeader,
                  { color: theme.colors.text.primary },
                ]}
              >
                Filter Courses
              </Text>
              <View style={{ width: 20, height: 20 }} />
            </View>

            <Text style={[styles.filterLabel, { color: theme.colors.text.primary }]}>
              Course Type
            </Text>
            <View style={styles.optionContainer}>
              <CheckBox
                title="Online"
                checked={selectedTypes.Online}
                containerStyle={{ backgroundColor: theme.colors.secondary }}
                textStyle={{ color: theme.colors.text.primary }}
                onPress={() => handleTypeSelection('Online')}
              />
              <CheckBox
                title="Physical"
                checked={selectedTypes.Physical}
                containerStyle={{ backgroundColor: theme.colors.secondary }}
                textStyle={{ color: theme.colors.text.primary }}
                onPress={() => handleTypeSelection('Physical')}
              />
            </View>

            <Text style={[styles.filterLabel, { color: theme.colors.text.primary }]}>
              Category
            </Text>
            <View style={styles.optionContainer}>
              {categories.map((category: any) => (
                <CheckBox
                  key={category.title}
                  title={category.title}
                  //@ts-ignore
                  checked={selectedCategories[category.title]}
                  containerStyle={{ backgroundColor: theme.colors.secondary }}
                  textStyle={{ color: theme.colors.text.primary }}
                  onPress={() => handleCategorySelection(category.title)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.applyButton,
                { backgroundColor: theme.colors.accent },
              ]}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text
                style={[
                  styles.applyButtonText,
                  { color: theme.colors.text.primary },
                ]}
              >
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Divider style={{ marginVertical: 10 }} />

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
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  searchBarContainer: {
    flex: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
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
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  modalHeader: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
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
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
  },
});


export default Courses;
