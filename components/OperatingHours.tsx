  import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  
  const OperatingHours = ({ hoursString }: { hoursString: string }) => {
    const parsedHours = parseOperatingHours(hoursString);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Get current time 
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isOpen = (hours: string) => {
      if (hours.toLowerCase() === "closed") return false;

      // Handle multiple ranges separated by &
      const timeRanges = hours.split("&").map((range) => range.trim());

      return timeRanges.some((range) => {
        const [start, end] = range.split("-").map((time) => {
          const [hour, minute] = time.split(":").map(Number);
          return hour * 60 + (minute || 0);
        });

        return currentMinutes >= start && currentMinutes < end;
      })
    }
  
    return (
      <View style={styles.container}>
        {parsedHours.map((entry, index) => {
            const isToday = entry.day.includes(today)
            const shopIsOpen = isToday && isOpen(entry.hours)

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
                    {isToday && (
                      <Text style={[
                        styles.status,
                        shopIsOpen ? styles.openStatus : styles.closedStatus
                      ]}>
                        {shopIsOpen ? "Open Now" : "Closed Now"}
                      </Text>
                    )}
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
    status: {
      fontSize: 14,
      fontFamily: 'Outfit_400Regular',
      marginLeft: 10,
    },
    openStatus: {
      color: "#4CAF50"
    },
    closedStatus: {
      color: "#F44336"
    }
  });
  
  
  export default OperatingHours;
  