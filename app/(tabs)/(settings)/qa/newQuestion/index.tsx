import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addNewQuestion } from '../../../../../redux/slices/questionSlice';
import { AppDispatch, RootState } from '../../../../../redux/store/store';
import { getAuth } from '@react-native-firebase/auth';
import SignInModal from '../../../../../components/SignInModal';
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import { useRouter } from 'expo-router';

const NewQuestionScreen = () => {
  const [form, setForm] = useState({ title: '', body: '', tags: '' });
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false); 
  const { ids, entities } = useSelector((state: RootState) => state.questions);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'Please create an account or sign in to post a question.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => setIsAuthModalVisible(true) },
        ]
      );
      return;
    }

    const { title, body, tags } = form;

    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Title and body are required.');
      return;
    }

    if (checkForSimilarQuestions(title, body)) {
      Alert.alert('Similar Question Detected', 'A similar question has already been asked.');
      return;
    }

    if (checkForProfanity(title, body, tags)) {
      Alert.alert('Profanity Detected', 'Please remove any inappropriate language.');
      return;
    }

    const newQuestion = {
      title,
      body,
      tags: tags.split(',').map((tag) => tag.trim()),
      userId: currentUser.uid,
      createdAt: new Date().toISOString(),
      votes: 0,
      answerCount: 0,
      views: 0,
      status: 'open' as 'open',
    };

    try {
      await dispatch(addNewQuestion(newQuestion)).unwrap();
      Alert.alert('Success', 'Your question has been posted!');
      setForm({ title: '', body: '', tags: '' });
      router.push('/qa');
    } catch (error) {
      Alert.alert('Error', 'Failed to post the question. Please try again.');
      console.error('Error posting question:', error);
    }
  };

  const checkForSimilarQuestions = (title: string, body: string) => {
    return ids.some((id) => {
      const question = entities[id];
      return (
        question.title.toLowerCase() === title.toLowerCase() ||
        question.body.toLowerCase().includes(body.toLowerCase())
      );
    });
  };

  const checkForProfanity = (title: string, body: string, tags: string) => {
    return (
      matcher.hasMatch(title) ||
      matcher.hasMatch(body) ||
      tags.split(',').some((tag) => matcher.hasMatch(tag.trim()))
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#ECDFCC"
        placeholder="Type a catchy title"
        value={form.title}
        onChangeText={(value) => handleChange('title', value)}
      />

      <Text style={styles.label}>Body</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholderTextColor="#ECDFCC"
        placeholder="Type your question"
        value={form.body}
        onChangeText={(value) => handleChange('body', value)}
        multiline
      />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#ECDFCC"
        placeholder="e.g., islam, fiqh, prayer"
        value={form.tags}
        onChangeText={(value) => handleChange('tags', value)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Publish</Text>
      </TouchableOpacity>

      {/* Sign In Modal */}
      <SignInModal
        isVisible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#2E3D3A',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 5,
  },
  input: {
    height: 50,
    backgroundColor: '#3A504C',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#A3C0BB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default NewQuestionScreen;
