import { View, Text, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SearchBar } from '@rneui/themed'
import { FontAwesome6 } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'

interface CategoryData {
  icon: string,
  title: string
}

interface CardData {
  backgroundColour: string,
  icon: string,
  hashtag: string,
  header: string,
  description: string,
}

const data = [
  {icon: '', title: 'All Courses'},
  {icon: '', title: 'Prayers'},
  {icon: '', title: 'Quran'},
  {icon: '', title: 'Fardu Ain'},
  {icon: '', title: 'Rihlah'},
  {icon: '', title: 'Taufiq'},
]

const cardData = [
  {
    backgroundColour: '#E0DCFC',
    icon: 'person-praying',
    hashtag: 'Prayers',
    header: 'Mastering Solat Jenazah',
    description:
      "Solat Jenazah, the Islamic funeral prayer, is a crucial ritual for honoring the deceased. This beginner's guide breaks down the steps, supplications, and etiquette, making it easy to learn and perform Solat Jenazah with confidence and respect.",
  },
  {
    backgroundColour: '#DEF682',
    icon: 'person-praying',
    hashtag: 'Prayers',
    header: 'Understanding Solat Fardhu',
    description:
      "Learn the essentials of the five daily prayers in Islam. This guide covers the steps, recitations, and intentions required to perform each prayer correctly.",
  },
  {
    backgroundColour: '#F4E281',
    icon: 'person-praying',
    hashtag: 'Prayers',
    header: 'Benefits of Tahajjud Prayer',
    description:
      "Explore the spiritual and physical benefits of performing the Tahajjud prayer, a voluntary night prayer in Islam that brings one closer to Allah.",
  },
  {
    backgroundColour: '#A6C9FF',
    icon: 'book',
    hashtag: 'Quran',
    header: 'Understanding Surah Al-Fatiha',
    description: 'A comprehensive guide to understanding the meanings and teachings of Surah Al-Fatiha.',
  },
  {
    backgroundColour: '#FFB29A',
    icon: 'book',
    hashtag: 'Quran',
    header: 'Tafsir of Surah Al-Baqarah',
    description: 'An in-depth analysis of the second surah of the Quran, Surah Al-Baqarah.',
  },
  {
    backgroundColour: '#E0DCFC',
    icon: 'book',
    hashtag: 'Quran',
    header: 'Memorizing Juz Amma',
    description: 'Tips and techniques for memorizing the 30th Juz of the Quran, known as Juz Amma.',
  },
  {
    backgroundColour: '#DEF682',
    icon: 'book',
    hashtag: 'Quran',
    header: 'Stories of the Prophets',
    description: 'Learn about the lives and lessons of the Prophets as mentioned in the Quran.',
  },
  {
    backgroundColour: '#F4E281',
    icon: 'chalkboard-teacher',
    hashtag: 'Fardu Ain',
    header: 'Introduction to Fardu Ain',
    description: 'An overview of the individual obligations in Islam that every Muslim must fulfill.',
  },
  {
    backgroundColour: '#A6C9FF',
    icon: 'chalkboard-teacher',
    hashtag: 'Fardu Ain',
    header: 'Fiqh of Purification',
    description: 'Detailed guide on the rules of purification in Islam, including wudu, ghusl, and tayammum.',
  },
  {
    backgroundColour: '#FFB29A',
    icon: 'chalkboard-teacher',
    hashtag: 'Fardu Ain',
    header: 'Fiqh of Prayer',
    description: 'Learn the jurisprudence of prayer in Islam, covering the different types and conditions of Salah.',
  },
  {
    backgroundColour: '#E0DCFC',
    icon: 'hiking',
    hashtag: 'Rihlah',
    header: 'Islamic Heritage Tours',
    description: 'Discover the historical and religious significance of various Islamic heritage sites around the world.',
  },
  {
    backgroundColour: '#DEF682',
    icon: 'hiking',
    hashtag: 'Rihlah',
    header: 'Hiking and Spirituality',
    description: 'Explore the connection between outdoor activities like hiking and spiritual well-being in Islam.',
  },
  {
    backgroundColour: '#F4E281',
    icon: 'hiking',
    hashtag: 'Rihlah',
    header: 'Pilgrimage to Mecca',
    description: 'A guide to performing Hajj and Umrah, the two Islamic pilgrimages to Mecca.',
  },
  {
    backgroundColour: '#A6C9FF',
    icon: 'medal',
    hashtag: 'Taufiq',
    header: 'Achieving Taufiq in Life',
    description: 'Tips and advice on how to achieve Taufiq, or divine success, in various aspects of life.',
  },
  {
    backgroundColour: '#FFB29A',
    icon: 'medal',
    hashtag: 'Taufiq',
    header: 'Spiritual Goals Setting',
    description: 'Learn how to set and achieve spiritual goals to enhance your faith and practice of Islam.',
  },
];

const EducationTab = () => {
  const [activeCategory, setactiveCategory] = useState<string | null>('All Courses');

  const handleCategoryPress = (title: string) => {
    setactiveCategory(title);
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
  
  const renderCardContent = ({ item }: { item: CardData }) => (
    <View key={item.header} style={styles.cardContainer}>
      <View style={[styles.cardIcon, { backgroundColor: item.backgroundColour }]}>
        <FontAwesome6 size={54} name={item.icon} color="white" />
      </View>
  
      <View style={styles.cardContent}>
        <View style={styles.cardHashTag}>
          <Text style={styles.hashtagText}>#{item.hashtag}</Text>
        </View>
        <View style={styles.cardDescription}>
          <Text style={styles.headerText}>{item.header}</Text>
          <Text style={styles.descriptionText} numberOfLines={2} ellipsizeMode='tail'>{item.description}</Text>
        </View>
      </View>
    </View>
  )

  const filteredCardData = activeCategory === 'All Courses'
    ? cardData
    : cardData.filter((card) => card.hashtag === activeCategory);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder='Search'
          lightTheme
          platform='default'
          round
          containerStyle={styles.searchBar}
          inputContainerStyle={{ backgroundColor: 'rgba(255,255,255,0.5)' }} 
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          renderItem={renderCategories}
          keyExtractor={(item) => item.title}
          style={styles.categoryList} 
        />
      </View>

      <FlatList 
        data={filteredCardData}
        renderItem={renderCardContent}
        keyExtractor={(item) => item.header}
        style={styles.cardList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4D6561',
  },
  searchBarContainer: {
    flex: 1,
    width: 360,
    height: 188,
    marginTop: 50,
    alignItems: 'center',
  },
  searchBar: {
    margin: 0,
    padding: 0,
    borderRadius: 20,
    width: 340,
  },
  categoryList: {
    width: 340,
    marginTop: 20,
    height: 35,
    flexGrow: 0,
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
  cardList: {
    width: 340, 
    height: 600,
    flexGrow: 0,
    top: -10
  },
  cardContainer: {
    width: 340,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowOffset: {width: -2, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 3,    
  },
  cardIcon: {
    width: 112,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    width: 176,
    height: 96,
    flexDirection: 'column',
    gap: 8,
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
    width: 176,
    height: 48,
    gap: 8,
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