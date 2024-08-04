import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect } from 'react';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

interface CourseDetail {
  id: string;
  backgroundColour: string;
  icon: string;
  hashtag: string;
  header: string;
  description: string;
  modules: string[];
}

const courseDetails: { [key: string]: CourseDetail } = {
  '1': {
    id: '1',
    backgroundColour: '#E0DCFC',
    icon: 'person-praying',
    hashtag: 'Prayers',
    header: 'Mastering Solat Jenazah',
    description: "Solat Jenazah, the Islamic funeral prayer, is a crucial ritual for honoring the deceased. This beginner's guide breaks down the steps, supplications, and etiquette, making it easy to learn and perform Solat Jenazah with confidence and respect.",
    modules: ['Introduction', 'Steps and Supplications', 'Etiquette', 'Practice'],
  },
  '2': {
    id: '2',
    backgroundColour: '#DEF682',
    icon: 'person-praying',
    hashtag: 'Prayers',
    header: 'Understanding Solat Fardhu',
    description: "Learn the essentials of the five daily prayers in Islam. This guide covers the steps, recitations, and intentions required to perform each prayer correctly.",
    modules: ['Introduction', 'Wudu', 'Steps and Recitations', 'Common Mistakes'],
  },
};

type Params = {
  id: string;
}

const CourseDetails = () => {
  const { id } = useLocalSearchParams<Params>();
  const course: CourseDetail = courseDetails[id];
  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (course) {
      navigation.setOptions({ title: course.header });
    }
  }, [navigation, course?.header]);

  if (!course) {
    return (
      <View>
        <Text>Course not Found</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: '#4D6561', flex: 1 }}>
        <View style={{ marginLeft: 16, marginTop: 20, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 16, lineHeight: 22, color: '#FFFFFF' }}>{course.header}</Text>
        </View>

        <ScrollView style={{ marginHorizontal: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ alignContent: 'center', justifyContent: 'center' }}>
                    <Image style={{ width: 48, height: 48, backgroundColor: '#FFFFFF', borderRadius: 24 }} />
                </View>
                <View style={{ alignContent: 'center', justifyContent: 'center', gap: 5 }}>
                    <Text style={styles.subText}>Author</Text>
                    <Text style={styles.mainText}>Ryan Gosling</Text>
                </View>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <FontAwesome6 name="file" regular color='white' size={20} />
                    <Text style={styles.contentText}>{`${course.modules.length} Modules`}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <FontAwesome6 name="clock" regular color='white' size={20} />
                    <Text style={styles.contentText}>{`${course.modules.length} Hours estimated time to finish`}</Text>
                </View>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
                <Text style={styles.subText}>Description</Text>
                <Text style={styles.contentText}>{course.description}</Text>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
                <Text style={styles.subText}>Modules</Text>
                {course.modules.map((module, index) => (
                    <View key={index} style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, gap: 4 }}>
                        <Text style={[styles.subText, { color: '#000000' }]}>{`${index + 1}. ${module}`}</Text>
                        <Text style={[styles.contentText, { color: '#000000' }]}>1 hour</Text>
                    </View>
                ))}
            </View>

            <View style={{ marginTop: 16 }}>
                <TouchableOpacity style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 20, alignItems: 'center' }}>
                    <Text style={styles.btnText}>Start Learning</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    subText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        lineHeight: 18,
        color: '#FFFFFF'
    },
    mainText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        lineHeight: 21,
        color: '#FFFFFF'
    },
    contentText: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        lineHeight: 18,
        color: '#FFFFFF'
    },
    btnText: {
        fontFamily: 'Outfit_500Medium', 
        fontSize: 16,
        lineHeight: 22,
        color: '#000000'
    }
})

export default CourseDetails;
