import { View, Text, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import React, { useLayoutEffect, useMemo, useState } from 'react'
import { Searchbar } from 'react-native-paper';
import { FontAwesome6 } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'
import { Link, useNavigation, useRouter } from 'expo-router'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import { useSelector } from 'react-redux'
import { RootState } from '../../../../redux/store/store'
import { CourseData } from '../../../../redux/slices/dashboardSlice'
import BackArrow from '../../../../components/BackArrow';

export interface CategoryData {
  icon: string,
  title: string
}

const data = [
  {icon: '', title: 'All Courses'},
  {icon: '', title: 'Prayers'},
  {icon: '', title: 'Quran'},
  {icon: '', title: 'Fardu Ain'},
  {icon: '', title: 'Rihlah'},
  {icon: '', title: 'Taufiq'},
]

const EducationTab = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { courses } = useSelector((state: RootState) => state.dashboard);
  const [activeCategory, setactiveCategory] = useState<string | null>('All Courses');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('Online');

  const handleCategoryPress = (title: string) => {
    setactiveCategory(title);
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  }

  const renderCategories = ({ item }: { item : CategoryData }) => (
    <TouchableOpacity
      style={[styles.category, item.title === activeCategory && styles.categoryActive]}
      key={item.title}
      onPress={() => handleCategoryPress(item.title)}
    >
      <Text style={styles.categoryText}>{item.title}</Text>
    </TouchableOpacity>
  )
  
  const renderCardContent = ({ item }: { item: CourseData }) => (
    <TouchableOpacity key={item.title} style={styles.cardContainer}>
      <Link href={`/courses/courseId/${item.id}`} >
        <View style={[styles.cardIcon, { backgroundColor: item.backgroundColour }]}>
          <FontAwesome6 size={54} name={item.icon} color="black" />
        </View>
    
        <View style={styles.cardContent}>
          <View style={styles.cardHashTag}>
            <Text style={styles.hashtagText}>{item.category}</Text>
          </View>
          <View style={styles.cardDescription}>
            <Text style={styles.headerText}>{item.title}</Text>
            <Text style={styles.descriptionText} numberOfLines={2} ellipsizeMode='tail'>{item.description}</Text>
          </View>
        </View>
      </Link>
    </TouchableOpacity>
  )

  const filteredCardData = courses.filter((card) => {
    const matchesCategory = activeCategory === 'All Courses' || card.category === activeCategory;
    const matchesSearchQuery = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    card.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSegment = selectedSegment === 'Online' ? card.type === 'online' : card.type === 'physical'
    return matchesCategory && matchesSearchQuery && matchesSegment;
  })

  return (
    <View style={styles.mainContainer}>
      <BackArrow />

      <Searchbar
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder='Search'
      />

      <SegmentedControl
        backgroundColor='#A3C0BB'
        style={{ height: 40 }}
        values={['Online', 'Physical']}
        selectedIndex={selectedSegment === 'Online' ? 0 : 1}
        onChange={(event) => {
          setSelectedSegment(event.nativeEvent.value);
        }}
      />

      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          renderItem={renderCategories}
          keyExtractor={(item) => item.title}
          />
      </View>

      <FlatList 
        data={filteredCardData}
        renderItem={renderCardContent}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#4D6561',
    gap: 16
  },
  categoryContainer: {
    height: 45,
  },
  category: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 35,
    width: 94,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 10,
  },
  categoryActive: {
    backgroundColor: '#C3F0E9'
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Outfit_500Medium',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 8,
    flexDirection: 'row',
    padding: 10,
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,    
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10
  },
  cardHashTag: {
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
    borderRadius: 100,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  hashtagText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 14,
    color: '#333333',
  },
  cardDescription: {
    marginTop: 5,
    gap: 5
  },
  headerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 16,
    color: '#333333',
  },
  descriptionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 14,
    color: '#333333',
  }
})

export default EducationTab