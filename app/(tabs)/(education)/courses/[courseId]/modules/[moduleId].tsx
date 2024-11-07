import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../../../redux/store/store';
import { completeModule } from '../../../../../../redux/slices/courseSlice';
import { getAuth } from '@react-native-firebase/auth';
import { CourseAndModuleProgress, CourseData, ModuleData } from '../../../../../../utils/types';
import PagerView from 'react-native-pager-view';

type Params = {
  courseId: string;
  moduleId: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ModuleDetails = () => {
  const { courseId, moduleId } = useLocalSearchParams<Params>(); // Extract courseId and moduleId from the URL
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Get the course data from Redux (dashboard slice)
  const course: CourseData | undefined = useSelector((state: RootState) =>
    state.dashboard.courses.find((c) => c.id === courseId)
  );

  // Get the user's progress for this course
  const userProgress: CourseAndModuleProgress | undefined = useSelector((state: RootState) =>
    state.dashboard.user?.enrolledCourses.find((p) => p.courseId === courseId)
  );

  const onPageSelected = (event: any) => {
    setCurrentIndex(event.nativeEvent.position);
  };

  useEffect(() => {
    if (course) {
      // Fetch the module data for the current module
      const module = course.modules.find((m: any) => m.moduleId === moduleId);
      if (module) {
        setModuleData(module);
      }
    }
  }, [course, moduleId]);

  useLayoutEffect(() => {
    if (moduleData) {
      navigation.setOptions({ headerTitle: moduleData?.title });
    }
  }, [navigation, moduleData?.title]);

  const handleCompleteModule = async () => {
    if (courseId && moduleId && userId && userProgress) {
      try {
        console.log('Current user progress:', userProgress);

        // Ensure course progress exists
        const moduleProgress = userProgress.status.modules[moduleId];
        if (!moduleProgress) {
          throw new Error('Module progress not found.');
        }

        // Complete the module
        await dispatch(completeModule({ courseId, moduleId, userId })).unwrap();

        // Find the index of the current module
        const currentModuleIndex = course?.modules.findIndex((m: any) => m.moduleId === moduleId);

        // Navigate to the next module or completion page
        if (currentModuleIndex !== undefined && currentModuleIndex < course!.modules.length - 1) {
          const nextModule = course!.modules[currentModuleIndex + 1];
          router.push(`/courses/${courseId}/modules/${nextModule.moduleId}`);
        } else {
          // If this was the last module, show a completion message or route to a course completion page
          alert('Congratulations! You have completed the course.');
          router.push('/courses'); // Or route to a different page
        }
      } catch (error) {
        console.error('Failed to complete module:', error);
      }
    }
  };

  if (!moduleData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
        {/* PagerView for Carousel */}
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={onPageSelected}
        >
          {moduleData.content.map((contentItem, index) => (
            <View key={index} style={styles.page}>
              <Text style={styles.contentTitle}>{contentItem.title}</Text>
              <Text style={styles.textContent}>{contentItem.data}</Text>
            </View>
          ))}
        </PagerView>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {moduleData.content.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Button to mark module as complete */}
        <TouchableOpacity style={styles.completeButton} onPress={handleCompleteModule}>
          <Text style={styles.completeButtonText}>Complete Module</Text>
        </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A'
  },
  pagerView: {
    flex: 1,
  },
  page: {
    gap: 20,
    width: SCREEN_WIDTH - 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B0B0B0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: SCREEN_WIDTH - 32,
    padding: 16,
    backgroundColor: '#3A504C',
    justifyContent: 'center',
  },
  contentTitle: {
    fontSize: 24,
    color: '#ECDFCC',
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 8,
  },
  textContent: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 18,
    lineHeight: 24,
    color: '#D1D5DB', // Medium grey for body text
  },
  completeButton: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#A3C0BB',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  completeButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default ModuleDetails;
