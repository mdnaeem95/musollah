import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
} from "react-native";
import Modal from 'react-native-modal';
import { useTheme } from "../../context/ThemeContext";
import { FontAwesome6 } from "@expo/vector-icons";
import { UserData } from "../../utils/types";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store/store";
import firestore from "@react-native-firebase/firestore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onInvite: (selected: UserData[]) => void;
}

const InviteFriendsModal: React.FC<Props> = ({ visible, onClose, onInvite }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useSelector((state: RootState) => state.user);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [selected, setSelected] = useState<{ [uid: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    return (
      <Modal
        avoidKeyboard 
        isVisible={visible} 
        onBackdropPress={onClose} 
        onSwipeComplete={onClose} 
        swipeDirection='down' 
        style={{ justifyContent: "flex-end", margin: 0, backgroundColor: 'transparent' }}
        backdropColor="rgba(0,0,0,0.5)"
        backdropOpacity={1} 
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.dragHandle} onPress={onClose} />
            <Text style={[styles.title, { marginTop: 20 }]}>Invite Friends</Text>
  
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.fallbackMessage}>
                You need to be signed in to invite friends.
              </Text>
            </View>
  
            <TouchableOpacity
              style={[styles.inviteButton, { opacity: 0.5 }]}
              disabled
            >
              <Text style={styles.inviteText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }  

  useEffect(() => {
    if (!user) return;
  
    const fetchFollowers = async () => {
      let followerIds = user.followers ? Object.keys(user.followers) : [];
  
      if (followerIds.length === 0) {
        const snapshot = await firestore().collection("users").limit(5).get();
        const randomUsers = snapshot.docs
          .filter(doc => doc.id !== user.id)
          //@ts-ignore
          .map(doc => ({ id: doc.id, ...(doc.data() as UserData) }));
        setFollowers(randomUsers);
      } else {
        const promises = followerIds.map((uid) => firestore().collection("users").doc(uid).get());
        const snapshots = await Promise.all(promises);
        //@ts-ignore
        const users = snapshots.map(doc => ({ id: doc.id, ...(doc.data() as UserData) }));
        setFollowers(users);
      }
    };
  
    fetchFollowers();
  }, [user?.followers]);
  

  const toggleSelect = (uid: string) => {
    setSelected(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleInvite = () => {
    const selectedUsers = followers.filter(f => selected[f.id]);
    onInvite(selectedUsers);
    setSelected({});
    onClose();
  };

  const filteredFollowers = followers.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal 
      isVisible={visible} 
      onBackdropPress={onClose} 
      onSwipeComplete={onClose} 
      swipeDirection='down' 
      style={{ justifyContent: "flex-end", margin: 0 }}
      backdropColor={theme.colors.primary}
      backdropOpacity={0.1}
      avoidKeyboard 
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.dragHandle} onPress={onClose} />
          <Text style={styles.title}>Invite Friends</Text>

          <TextInput
            placeholder="Search followers..."
            placeholderTextColor={theme.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />

          <FlatList
            data={filteredFollowers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.userRow} onPress={() => toggleSelect(item.id)}>
                <Image
                  source={{ uri: item.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}` }}
                  style={styles.avatar}
                />
                <Text style={styles.name}>{item.name}</Text>
                <View style={[styles.checkbox, selected[item.id] && styles.checkedCheckbox]}>
                  {selected[item.id] && <FontAwesome6 name="check" size={12} color={theme.colors.text.primary} />}
                </View>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={[styles.inviteButton, { opacity: Object.keys(selected).length ? 1 : 0.5 }]}
            disabled={Object.keys(selected).length === 0}
            onPress={handleInvite}
          >
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => {
  const screenHeight = Dimensions.get("window").height;
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.secondary,
      height: screenHeight * 0.85,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    dragHandle: {
      width: 40,
      height: 5,
      backgroundColor: theme.colors.muted,
      borderRadius: 3,
      alignSelf: "center",
      marginBottom: 10,
    },
    title: {
      fontSize: 18,
      fontFamily: "Outfit_600SemiBold",
      color: theme.colors.text.primary,
      marginBottom: 16,
      textAlign: "center",
    },
    searchInput: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontFamily: "Outfit_400Regular",
      fontSize: 14,
      color: theme.colors.text.primary,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    name: {
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.primary,
      flex: 1,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    checkedCheckbox: {
      backgroundColor: theme.colors.muted,
    },
    inviteButton: {
      backgroundColor: theme.colors.muted,
      paddingVertical: 14,
      borderRadius: 12,
    },
    inviteText: {
      color: theme.colors.text.primary,
      textAlign: "center",
      fontFamily: "Outfit_600SemiBold",
      fontSize: 16,
    },
    fallbackMessage: {
      fontSize: 16,
      fontFamily: "Outfit_400Regular",
      color: theme.colors.text.secondary,
      textAlign: "center",
      marginTop: 20,
      marginBottom: 20,
    }    
  });
};

export default InviteFriendsModal;