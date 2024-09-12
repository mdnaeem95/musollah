import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  backgroundColour: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ id, title, description, category, icon, backgroundColour }) => {
  return (
    <TouchableOpacity style={styles.cardContainer}>
      <Link href={`/courses/${id}`}>
        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Icon Section */}
          <View style={[styles.courseIcon, { backgroundColor: backgroundColour }]}>
            <FontAwesome6 size={32} name={icon} color="black" />
          </View>
          
          {/* Course Details Section */}
          <View style={styles.textDetailsContainer}>
            <View style={styles.courseCategory}>
              <Text>{category}</Text>
            </View>
            <View style={styles.courseDescription}>
              <Text style={styles.courseHeader}>{title}</Text>
              <Text style={styles.courseDescriptionText} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
            </View>
          </View>
        </View>
      </Link>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    width: '100%', // Ensure card takes full width
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  courseIcon: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  textDetailsContainer: {
    width: '80%'
  },
  courseCategory: {
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
    borderRadius: 50,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  courseCategoryText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#333333',
  },
  courseDescription: {
    justifyContent: 'center',
  },
  courseHeader: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  courseDescriptionText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#666666'
  }
});

export default CourseCard;
