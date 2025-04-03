// ✅ LoginScreen.js complet cu stele animate
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const stars = [
  { top: 30, left: 40 },
  { top: 60, left: 200 },
  { top: 90, left: 100 },
  { top: 130, left: 250 },
  { bottom: 60, left: 40 },
  { bottom: 90, right: 60 },
];

const shapedStars = [
  { top: 20, left: 50, symbol: "✧" },
  { top: 80, right: 30, symbol: "✦" },
  { top: 120, left: 120, symbol: "★" },
  { bottom: 140, right: 40, symbol: "✦" },
];

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const navigation = useNavigation();
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

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        Alert.alert("Cont neverificat", "Verifică-ți emailul pentru a continua.");
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          favorites: [],
        });
      }
      Alert.alert("Autentificare reușită!");
      navigation.navigate("ExplorePage");
    } catch (error) {
      Alert.alert("Eroare", error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Atenție", "Introdu emailul mai înainte.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Succes", "Emailul pentru resetare a fost trimis.");
    } catch (error) {
      Alert.alert("Eroare", error.message);
    }
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#2e2e60", "#4e54c8"]} style={styles.container}>
      {/* Stele decorative */}
      {stars.map((star, index) => (
        <Animated.View key={index} style={[styles.star, star, { opacity: starAnim }]} />
      ))}
      {shapedStars.map((item, idx) => (
        <Animated.Text key={idx} style={[styles.shapedStar, item, { opacity: starAnim }]}>
          {item.symbol}
        </Animated.Text>
      ))}

      <KeyboardAvoidingView style={{ flex: 1, width: "100%" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.welcome}>Bine ai revenit! 👋</Text>
          <View style={styles.card}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              placeholder="Parolă"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            <TouchableOpacity onPress={handleForgotPassword} style={{ marginBottom: 20 }}>
              <Text style={{ color: "#007bff", textAlign: "right" }}>🔐 Ai uitat parola?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setKeepLoggedIn(!keepLoggedIn)} style={styles.keepLoggedIn}>
              <View
                style={[styles.checkbox, { backgroundColor: keepLoggedIn ? "#007bff" : "transparent" }]}
              >
                {keepLoggedIn && <Text style={{ color: "white", fontWeight: "bold" }}>✔</Text>}
              </View>
              <Text style={{ color: "#343a40" }}>Păstrează-mă conectat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>Autentificare</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 20 }}>
              <Text style={{ color: "#007bff", textAlign: "center" }}>
                Nu ai cont? Înregistrează-te
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  keepLoggedIn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  loginButton: {
    backgroundColor: "#28a745",
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

export default LoginScreen;