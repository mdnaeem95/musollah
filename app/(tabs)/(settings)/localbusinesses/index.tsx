import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';

const index = () => {
    const router = useRouter();

    return (
        <View style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Discover Local Muslim Businesses</Text>
              <Text style={styles.subHeaderText}>
                Support the community by connecting with halal-certified and Muslim-owned businesses.
              </Text>
            </View>
    
            {/* Featured Businesses */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Featured Businesses</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.horizontalScroll}>
                  <TouchableOpacity style={styles.featuredCard}>
                    <Text style={styles.cardText}>Business 1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.featuredCard}>
                    <Text style={styles.cardText}>Business 2</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.featuredCard}>
                    <Text style={styles.cardText}>Business 3</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
    
            {/* Categories Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.gridContainer}>
                <TouchableOpacity style={styles.gridItem}>
                  <Text style={styles.iconLabel}>Catering</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridItem}>
                  <Text style={styles.iconLabel}>Clothing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridItem}>
                  <Text style={styles.iconLabel}>Services</Text>
                </TouchableOpacity>
              </View>
            </View>
    
            {/* Call-to-Action Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Get Involved</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push("/localbusinesses/addbusiness")}>
                    <Text style={styles.actionButtonText}>Add Your Business</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      );
}

const styles = StyleSheet.create({
mainContainer: {
    flex: 1,
    backgroundColor: '#2E3D3A', // Main background color
},
scrollContainer: {
    padding: 16,
},
headerContainer: {
    marginBottom: 20,
},
headerText: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F4E2C1',
    marginBottom: 8,
},
subHeaderText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#FFFFFF',
},
sectionContainer: {
    marginTop: 24,
},
sectionTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#ECDFCC',
    marginBottom: 16,
},
horizontalScroll: {
    flexDirection: 'row',
},
featuredCard: {
    width: 200,
    height: 120,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#3D4F4C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
},
cardText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
},
gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
},
gridItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#3D4F4C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
},
iconLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    color: '#F4E2C1',
},
actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
},
actionButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3D4F4C',
    alignItems: 'center',
    justifyContent: 'center',
},
actionButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
},
});

export default index