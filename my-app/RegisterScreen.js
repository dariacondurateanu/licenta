// (Tot importul rămâne identic, doar adăugăm Animated + stele)
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from "react-native";
import { auth, db } from "./firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";

const stars = [
  { top: 30, left: 40 },
  { top: 60, left: 200 },
  { top: 90, left: 100 },
  { top: 130, left: 250 },
  { top: 170, left: 60 },
  { top: 50, left: 280 },
  { bottom: 60, left: 40 },
  { bottom: 90, right: 60 },
];

const shapedStars = [
  { top: 20, left: 50, symbol: "✧" },
  { top: 80, right: 30, symbol: "✦" },
  { top: 120, left: 120, symbol: "★" },
  { top: 160, right: 80, symbol: "✧" },
  { bottom: 140, right: 40, symbol: "✦" },
  { bottom: 100, left: 70, symbol: "★" },
];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const starAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(starAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(starAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Eroare", "Completează toate câmpurile!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        favorites: [],
      });

      await sendEmailVerification(user);
      await auth.signOut();

      Alert.alert(
        "Verificare necesară",
        "Ți-am trimis un email pentru confirmare. Te rugăm să-l verifici înainte de autentificare.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("EmailVerificationScreen", { user }),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Eroare", error.message);
      console.error("Eroare la înregistrare:", error);
    }
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#2e2e60", "#4e54c8"]} style={styles.container}>
      {stars.map((star, index) => (
        <Animated.View key={index} style={[styles.star, { ...star, opacity: starAnim }]} />
      ))}
      {shapedStars.map((item, idx) => (
        <Animated.Text key={`shaped-${idx}`} style={[styles.shapedStar, { ...item, opacity: starAnim }]}>
          {item.symbol}
        </Animated.Text>
      ))}

      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%" }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.welcome}>Creează-ți contul 🧑‍💻</Text>

          <View style={styles.card}>
            <TextInput placeholder="Nume" value={name} onChangeText={setName} style={styles.input} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.input} />
            <TextInput placeholder="Parolă" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

            <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
              <Text style={styles.buttonText}>Creează cont</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 20 }}>
              <Text style={{ color: "#007bff", textAlign: "center" }}>
                Ai deja un cont? Autentifică-te
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  welcome: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
  },
  registerButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#cfd8dc",
  },
  shapedStar: {
    position: "absolute",
    fontSize: 12,
    color: "#e0e0e0",
  },
});
