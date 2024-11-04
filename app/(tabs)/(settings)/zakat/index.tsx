import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';

const ZakatIndex = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.mainContainer}>
            <View style={styles.cardContainer}>
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => router.push('/zakat/harta')}
                >
                    <FontAwesome6 name="money-bill" size={40} color="#ECDFCC" style={styles.icon} />
                    <Text style={styles.cardTitle}>Zakat Harta</Text>
                    <Text style={styles.cardDescription}>
                        Calculate zakat on savings, gold, insurance, and shares.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => router.push('/zakat/fidyah')}
                >
                    <FontAwesome6 name="heart-pulse" size={40} color="#ECDFCC" style={styles.icon} />
                    <Text style={styles.cardTitle}>Zakat Fidyah</Text>
                    <Text style={styles.cardDescription}>
                        Learn and calculate fidyah for missed fasts.
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#2E3D3A',
    padding: 16,
  },
  icon: {
    marginBottom: 15
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  card: {
    backgroundColor: '#3D4F4C',
    padding: 30,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#ECDFCC',
    textAlign: 'center'
  },
});

export default ZakatIndex;
