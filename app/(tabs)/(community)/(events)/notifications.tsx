import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
import { useAuth } from "../../../../context/AuthContext";
import firestore from "@react-native-firebase/firestore";
import { Notification } from "../../../../utils/types";
import { format } from "date-fns";

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyMessage}>You're not signed in</Text>
        <Text style={styles.subMessage}>
          Please log in to see your notifications and stay updated!
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection("notifications")
      .where("targetUserId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            //@ts-ignore
            id: doc.id,
            ...(doc.data() as Notification),
          }));
          setNotifications(data);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching notifications:", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user?.uid]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;

    return format(date, "EEE, h:mma");
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await firestore().collection("notifications").doc(id).update({
        read: true,
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };  

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.read;
  
    return (
      <TouchableOpacity
        onPress={() => markNotificationAsRead(item.id)}
        style={styles.notificationRow}
      >
        {isUnread ? <View style={styles.unreadDot} /> : <View style={styles.dotPlaceholder} />}
        
        <Image
          source={{ uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.senderName!)}` }}
          style={styles.avatar}
        />
  
        <View style={styles.messageContainer}>
          <Text
            style={[
              styles.message,
              isUnread ? styles.unreadMessage : styles.readMessage,
            ]}
          >
            {item.message}
          </Text>
        </View>
  
        <Text
          style={[
            styles.timeText,
            isUnread ? styles.unreadTime : styles.readTime,
          ]}
        >
          {formatTime(item.createdAt)}
        </Text>
      </TouchableOpacity>
    );
  };  

  return (
    <View style={styles.container}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyMessage}>No notifications yet</Text>
          <Text style={styles.subMessage}>
            Start exploring events and following others to see updates here!
          </Text>
        </View>
      ) : (
        <>
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={async () => {
              const unread = notifications.filter((n) => !n.read);
              const batch = firestore().batch();
              unread.forEach((n) => {
                batch.update(firestore().collection("notifications").doc(n.id), { read: true });
              });
              try {
                await batch.commit();
              } catch (err) {
                console.error("Failed to mark all as read", err);
              }
            }}
            style={{ alignSelf: 'flex-end', marginVertical: 10 }}
          >
            <Text style={{
              fontSize: 14,
              fontFamily: "Outfit_500Medium",
              color: theme.colors.text.muted,
            }}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
        
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
        />
        </>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
    },
    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
    },
    messageContainer: {
      flex: 1,
      justifyContent: "center",
    },
    message: {
      fontSize: 15,
      color: theme.colors.text.primary,
      fontFamily: "Outfit_400Regular",
    },
    timeText: {
      fontSize: 12,
      color: theme.colors.text.muted,
      fontFamily: "Outfit_400Regular",
      marginLeft: 10,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: 20,
    },
    emptyMessage: {
      fontSize: 18,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    subMessage: {
      fontSize: 14,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.error || "#FF3B30",
      marginRight: 8,
    },
    dotPlaceholder: {
      width: 8,
      height: 8,
      marginRight: 8,
    },
    unreadMessage: {
      fontFamily: "Outfit_500Medium",
      color: theme.colors.text.primary,
    },
    readMessage: {
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.muted,
    },
    unreadTime: {
      fontSize: 12,
      color: theme.colors.text.primary,
      fontFamily: "Outfit_400Regular",
      marginLeft: 10,
    },
    readTime: {
      fontSize: 12,
      color: theme.colors.text.muted,
      fontFamily: "Outfit_400Regular",
      marginLeft: 10,
    },    
  });

export default NotificationsScreen;