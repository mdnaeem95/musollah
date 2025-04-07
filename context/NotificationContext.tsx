import React, {
    createContext,
    useContext,
    useState,
    useRef,
    ReactNode,
    useEffect,
  } from "react";
  import * as Notifications from "expo-notifications";
  import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
  import firestore from "@react-native-firebase/firestore";
  import { Notification as AppNotification } from "../utils/types";
  import { useAuth } from "./AuthContext";
  import Toast from "react-native-toast-message";
  
  interface NotificationContextType {
    expoPushToken: string | null;
    notification: Notifications.Notification | null;
    error: Error | null;
    inAppNotifications: AppNotification[];
    unreadCount: number;
  }
  
  const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined
  );
  
  export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
      throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
  };
  
  interface NotificationProviderProps {
    children: ReactNode;
  }
  
  export const NotificationProvider: React.FC<NotificationProviderProps> = ({
    children,
  }) => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [inAppNotifications, setInAppNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastToastIdRef = useRef<string | null>(null);
  
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();
  
    const { user } = useAuth();
  
    // 1. Register for push notifications and set listeners
    useEffect(() => {
      registerForPushNotificationsAsync().then(
        (token) => setExpoPushToken(token),
        (err) => setError(err)
      );
  
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log("📥 Notification received (foreground):", notification);
        setNotification(notification);
      });
  
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📨 Notification response received:", response);
      });
  
      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }, []);
  
    // 2. Save token to Firestore when available
    useEffect(() => {
      const savePushToken = async () => {
        if (user?.uid && expoPushToken) {
          try {
            await firestore().collection("users").doc(user.uid).update({
              expoPushToken,
            });
            console.log("✅ Saved push token to Firestore");
          } catch (err) {
            console.error("❌ Failed to save push token:", err);
          }
        }
      };
      savePushToken();
    }, [user?.uid, expoPushToken]);
  
    // 3. Listen to Firestore for in-app notifications
    useEffect(() => {
      if (!user?.uid) return;
  
      const unsubscribe = firestore()
        .collection("notifications")
        .where("targetUserId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .onSnapshot((snapshot) => {
          const allNotifs = snapshot.docs.map((doc) => ({
            //@ts-ignore
            id: doc.id,
            ...(doc.data() as AppNotification),
          }));
  
          const unread = allNotifs.filter((n) => !n.read);
          setUnreadCount(unread.length);
          setInAppNotifications(allNotifs);
  
          if (unread.length && unread[0].message && unread[0].id !== lastToastIdRef.current) {
            Toast.show({
              type: "info",
              text1: unread[0].message,
            });
            lastToastIdRef.current = unread[0].id;
          }
        });
  
      return () => unsubscribe();
    }, [user?.uid]);
  
    return (
      <NotificationContext.Provider
        value={{
          expoPushToken,
          notification,
          error,
          inAppNotifications,
          unreadCount,
        }}
      >
        {children}
      </NotificationContext.Provider>
    );
  };  