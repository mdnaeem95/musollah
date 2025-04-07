import React from "react";
import { View, Text } from "react-native";
import { useUserStats } from "../../hooks/useUserStats";

const UserStats = ({ styles }: { styles: any }) => {
  const { followers, following } = useUserStats();

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{following}</Text>
        <Text style={styles.statsLabel}>Following</Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{followers}</Text>
        <Text style={styles.statsLabel}>Followers</Text>
      </View>
    </View>
  );
};

export default UserStats;