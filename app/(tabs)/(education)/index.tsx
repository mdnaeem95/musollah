import { View, Text, FlatList, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SearchBar } from '@rneui/themed'
import { FontAwesome6 } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

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
  const router = useRouter();
  const [activeCategory, setactiveCategory] = useState<string | null>('All Courses');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredCardData = cardData.filter((card) => {
    const matchesCategory = activeCategory === 'All Courses' || card.hashtag === activeCategory;
    const matchesSearchQuery = card.header.toLowerCase().includes(searchQuery.toLowerCase()) || 
    card.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearchQuery;
  })

  return (
    <View style={styles.mainContainer}>
      <View style={styles.searchBarContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder='Search'
          lightTheme
          platform='default'
          round
          containerStyle={styles.searchBar}
          inputContainerStyle={{ backgroundColor: 'rgba(255,255,255,0.5)' }} 
        />
        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={data}
            renderItem={renderCategories}
            keyExtractor={(item) => item.title}
            style={styles.categoryList} 
            />
        </View>
        <TouchableOpacity
          style={styles.physicalClassesButton}
          onPress={() => router.push('physicalclasses')}
        >
          <Text style={styles.physicalClassesButtonText}>View Physical Classes</Text>
        </TouchableOpacity>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#4D6561',
  },
  searchBarContainer: {
    width: '100%',
    paddingTop: 50,
    alignItems: 'center',
  },
  searchBar: {
    margin: 0,
    padding: 0,
    borderRadius: 20,
    width: '90%',
  },
  categoryContainer: {
    marginTop: 10,
    height: 45,
    width: '90%'
  },
  categoryList: {
    width: '100%',
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
  physicalClassesButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
  },
  physicalClassesButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  categoryText: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Outfit_500Medium',
  },
  cardList: {
    width: '90%'
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