import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addQuestion } from '../../../../../redux/slices/qaSlice';
import { AppDispatch, RootState } from '../../../../../redux/store/store';
import { Question } from '../../../../../utils/types';
import { getAuth } from '@react-native-firebase/auth';
import SignInModal from '../../../../../components/SignInModal';
import {
	RegExpMatcher,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';
import { useRouter } from 'expo-router';

const NewQuestionScreen = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const { questions } = useSelector((state: RootState) => state.qa);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false); 
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const matcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleSubmit = () => {
    if (!currentUser) {
      Alert.alert(
        'Authentication Required',
        'Please create an account or sign in to post a question.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Up', onPress: () => setIsAuthModalVisible(true) }
        ]
      );
      return;
    }

    if (!title || !body) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }

    // Check for similar questions
    const isSimilarQuestion = questions.some(
      (q) => q.title.toLowerCase() === title.toLowerCase() || q.body.toLowerCase().includes(body.toLowerCase())
    );

    if (isSimilarQuestion) {
      Alert.alert('Similar Question Detected', 'A similar question has already been asked. Please check the existing questions.');
      return;
    }

    // Check for profanities in title, body, and tags using obscenity matcher
    if (
      matcher.hasMatch(title) ||
      matcher.hasMatch(body) ||
      tags.split(',').some(tag => matcher.hasMatch(tag.trim()))
    ) {
      Alert.alert('Profanity Detected', 'Please remove any inappropriate language from the title, body, or tags.');
      return;
    }

    const newQuestion: Partial<Question> = {
      title,
      body,
      tags: tags.split(',').map(tag => tag.trim()),
      userId: currentUser.uid,
      createdAt: new Date(),
      votes: 0,
      answerCount: 0,
      views: 0,
      status: 'open',
    };

    try {
        dispatch(addQuestion(newQuestion));
        Alert.alert('Success', 'Your question has been posted!');
        setTitle('')
        setBody('')
        setTags('')
        router.push('/qa')
    } catch (error) {
        Alert.alert('Error', 'Failed to post question.')
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#ECDFCC"
        placeholder="Type catching attention title"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Body</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholderTextColor="#ECDFCC"
        placeholder="Type your question"
        value={body}
        onChangeText={setBody}
        multiline
      />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#ECDFCC"
        placeholder="e.g. islam, fiqh, prayer"
        value={tags}
        onChangeText={setTags}
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
