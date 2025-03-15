import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { auth } from "./firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";

const AccountDetailsScreen = () => {
  const user = auth.currentUser;

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Succes", "Ți-am trimis un email pentru resetarea parolei.");
    } catch (error) {
      console.error("Eroare resetare:", error);
      Alert.alert("Eroare", "A apărut o problemă la resetarea parolei.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalii cont</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Nume:</Text>
        <Text style={styles.value}>{user.displayName || "N/A"}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>

      <TouchableOpacity onPress={handleResetPassword} style={styles.resetButton}>
        <Text style={styles.resetText}>Ai uitat parola? Modifică aici</Text>
      </TouchableOpacity>
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  infoBox: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#666",
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  resetButton: {
    marginTop: 30,
    alignItems: "center",
  },
  resetText: {
    fontSize: 16,
    color: "#007bff",
  },
});

export default AccountDetailsScreen;
