import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const stars = [
  { top: 60, left: 40 },
  { top: 100, left: 200 },
  { top: 150, left: 120 },
  { top: 200, left: 300 },
  { bottom: 100, right: 60 },
  { bottom: 150, left: 100 },
];

const shapedStars = [
  { top: 30, left: 80, symbol: "✧" },
  { top: 80, right: 50, symbol: "✦" },
  { top: 140, left: 140, symbol: "★" },
  { bottom: 120, left: 60, symbol: "✧" },
  { bottom: 80, right: 80, symbol: "★" },
];

const EmailVerificationScreen = ({ navigation, route }) => {
  const [checking, setChecking] = useState(false);
  const user = route.params?.user;

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

  const handleCheckVerification = async () => {
    if (!user) {
      Alert.alert("Sesiune lipsă", "Te rugăm să te autentifici din nou.");
      navigation.navigate("Login");
      return;
    }

    setChecking(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        Alert.alert("✅ Verificat", "Emailul tău a fost confirmat!");
        navigation.navigate("Login");
      } else {
        Alert.alert("⏳ Nu e verificat încă", "Verifică mailul și încearcă din nou.");
      }
    } catch (error) {
      Alert.alert("Eroare", error.message);
    }
    setChecking(false);
  };

  return (
    <LinearGradient colors={["#1a1a2e", "#2e2e60", "#4e54c8"]} style={styles.container}>
      {/* Stele animate */}
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              ...star,
              opacity: starAnim,
            },
          ]}
        />
      ))}
      {shapedStars.map((item, idx) => (
        <Animated.Text
          key={`shaped-${idx}`}
          style={[
            styles.shapedStar,
            {
              ...item,
              opacity: starAnim,
            },
          ]}
        >
          {item.symbol}
        </Animated.Text>
      ))}

      <View style={styles.content}>
        <Text style={styles.title}>
          📧 Ți-am trimis un email pentru verificare.
        </Text>
        <Text style={styles.subtitle}>
          După ce confirmi, apasă pe butonul de mai jos pentru a continua.
        </Text>

        <TouchableOpacity
          onPress={handleCheckVerification}
          disabled={checking}
          style={[
            styles.button,
            { backgroundColor: checking ? "#ccc" : "#28a745" },
          ]}
        >
          <Text style={styles.buttonText}>
            {checking ? "Verificăm..." : "✅ Am verificat"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#ddd",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
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

export default EmailVerificationScreen;
