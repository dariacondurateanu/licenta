import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";

import { auth, db } from "./firebaseConfig";
import {
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";


const avatarOptions = [ 
  require("./avatars/avatar1.png"),
  require("./avatars/avatar2.png"),
  require("./avatars/avatar3.png"),
  require("./avatars/avatar4.png"),
  require("./avatars/avatar5.png"),
  require("./avatars/avatar6.png"),
  require("./avatars/avatar7.png"),
  require("./avatars/avatar8.png"),
  require("./avatars/avatar9.png"),
];

const AccountDetailsScreen = () => {
  const user = auth.currentUser;
  const navigation = useNavigation();
  const [newName, setNewName] = useState(user.displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  useEffect(() => {
    const fetchUserImage = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userImage) {
            setProfileImage(data.userImage);
          }
        }
      } catch (err) {
        console.error("❌ Eroare la fetchUserImage:", err);
      }
    };

    fetchUserImage();
  }, []);

  const handleSelectAvatar = async (imageSource) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        userImage: Image.resolveAssetSource(imageSource).uri,
      });
      setProfileImage(Image.resolveAssetSource(imageSource).uri);
      setShowAvatarOptions(false);
      Alert.alert("Succes", "Avatarul a fost actualizat!");
    } catch (error) {
      console.error("❌ Eroare la actualizare avatar:", error);
      Alert.alert("Eroare", "Nu s-a putut actualiza avatarul.");
    }
  };

  const handleUpdateName = async () => {
    try {
      await updateProfile(user, { displayName: newName });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { name: newName });

      setIsEditing(false);
      Alert.alert("Succes", "Numele a fost actualizat.");
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut actualiza numele.");
    }
  };



  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Eroare", "Nu am reușit să te delogăm.");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert("Confirmare", "Ești sigur că vrei să îți ștergi contul?", [
      { text: "Anulează", style: "cancel" },
      {
        text: "Șterge",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "users", user.uid));
            await user.delete();
            navigation.navigate("Register");
          } catch (error) {
            Alert.alert(
              "Eroare",
              "Trebuie să te reloghezi recent pentru a șterge contul."
            );
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 Detalii cont</Text>

      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("./assets/avatar-placeholder.png")
            }
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setShowAvatarOptions(!showAvatarOptions)}
          >
            <Feather name="edit-2" size={18} color="#333" />
          </TouchableOpacity>
        </View>

        <Modal
  isVisible={showAvatarOptions}
  onBackdropPress={() => setShowAvatarOptions(false)}
  style={styles.bottomModal}
>
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Alege un avatar</Text>
    <View style={styles.avatarGrid}>
      {avatarOptions.map((avatar, index) => (
        <TouchableOpacity key={index} onPress={() => handleSelectAvatar(avatar)}>
          <Image source={avatar} style={styles.avatarOptionModal} />
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Nume:</Text>
          {isEditing ? (
            <>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={handleUpdateName}
                style={styles.saveButton}
              >
                <Text style={styles.saveText}>Salvează</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.value}>{user.displayName || "N/A"}</Text>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              >
                <Text style={styles.editText}>Editează</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>


        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪 Deloghează-te</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteButton}>
          <Text style={styles.deleteText}>🗑️ Șterge contul</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#f0f2f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 6,
    elevation: 3,
  },
  avatarList: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    margin: 8,
  },
  infoBox: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#777",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  editButton: {
    marginTop: 5,
  },
  editText: {
    color: "#007bff",
    fontSize: 14,
  },
  saveButton: {
    marginTop: 10,
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 8,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resetButton: {
    marginTop: 10,
    alignItems: "center",
  },
  resetText: {
    fontSize: 16,
    color: "#007bff",
  },
  logoutButton: {
    marginTop: 20,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    color: "#dc3545",
  },
  deleteButton: {
    marginTop: 10,
    alignItems: "center",
  },
  deleteText: {
    fontSize: 16,
    color: "#ff4d4f",
  },
  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  avatarOptionModal: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 15,
  },
  
});

export default AccountDetailsScreen;
