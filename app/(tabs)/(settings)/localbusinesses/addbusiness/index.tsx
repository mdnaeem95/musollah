// File: screens/AddBusinessForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';

const AddBusinessForm = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = async () => {
    if (!name || !category || !description || !address || !contact) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await firestore().collection('businesses').add({
        name,
        category,
        description,
        address,
        contact,
        rating: 0, // Default rating
        featured: false,
      });
      Alert.alert('Success', 'Business added successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add business');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Your Business</Text>
      <TextInput
        style={styles.input}
        placeholder="Business Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        placeholderTextColor="#888"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        placeholderTextColor="#888"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact Info"
        placeholderTextColor="#888"
        value={contact}
        onChangeText={setContact}
      />
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4E2C1',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#3D4F4C',
    padding: 12,
    borderRadius: 8,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#3D4F4C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
  },
});

export default AddBusinessForm;
