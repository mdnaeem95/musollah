  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  
  const OperatingHours = ({ hoursString }: { hoursString: string }) => {
    const parsedHours = parseOperatingHours(hoursString);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Operating Hours</Text>
        {parsedHours.map((entry, index) => {
            const isToday = entry.day.includes(today)

            return (
                <View
                    key={index}
                    style={[
                    styles.entry,
                    entry.day.includes(today) && styles.todayHighlight, // Highlight current day
                    ]}
                >
                    <Text style={[styles.day, isToday && styles.todayDay]}>{entry.day}</Text>
                    <Text style={[styles.hours, isToday && styles.todayHours]}>{entry.hours}</Text>
                </View>
            )
        })}
      </View>
    );
  };
  
  const parseOperatingHours = (hoursString: string) => {
    // Split by commas to separate each day's entry
    const days = hoursString.split(',');
  
    return days.map((day) => {
      // Split each entry into day and hours by the first occurrence of ":"
      const [dayName, ...hoursParts] = day.split(':');
      return {
        day: dayName.trim(), // Ensure no trailing spaces
        hours: hoursParts.join(':').trim(), // Join back the hours in case ":" appears in the time
      };
    });
  };  
  
  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    title: {
      fontSize: 18,
      fontFamily: "Outfit_600SemiBold",
      color: '#F4E2C1',
      marginBottom: 8,
    },
    entry: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
      paddingVertical: 4,
    },
    day: {
      fontSize: 16,
      fontFamily: "Outfit_600SemiBold",
      color: '#F4E2C1',
    },
    hours: {
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
      color: '#F4E2C1',
    },
    todayHighlight: {
      backgroundColor: '#F4E2C1', // Highlight background
      borderRadius: 5,
      padding: 6,
    },
    todayDay: {
      color: '#2E3D3A', // Dark text for highlighted day
    },
    todayHours: {
      color: '#2E3D3A', // Dark text for highlighted hours
    },
  });
  
  
  export default OperatingHours;
  