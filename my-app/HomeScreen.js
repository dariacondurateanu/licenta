import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const buttonStyle = (bgColor) => ({
  backgroundColor: bgColor,
  padding: 14,
  borderRadius: 10,
  alignItems: "center",
  width: "100%",
});

const buttonText = {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
};

const HomeScreen = ({ navigation }) => {
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

  return (
    <LinearGradient colors={["#1a1a2e", "#2e2e60", "#4e54c8"]} style={styles.container}>
      {/* Stele decorative */}
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              opacity: starAnim,
            },
          ]}
        />
      ))}
{/* Stele în formă de stea */}
{shapedStars.map((item, idx) => (
  <Animated.Text
    key={`shaped-${idx}`}
    style={[
      styles.shapedStar,
      {
        opacity: starAnim,
        ...item,
      },
    ]}
  >
    {item.symbol}
  </Animated.Text>
))}
      {/* Branding */}
      <View style={styles.header}>
        <Text style={styles.logo}>CityHub 🌇</Text>
        <Text style={styles.slogan}>Descoperă orașul tău într-un mod nou</Text>
        <Text style={styles.emojiRow}>🍽️ 🎶 ☕</Text>
      </View>

      {/* Card cu butoane */}
      <View style={styles.card}>
        <TouchableOpacity style={buttonStyle("#8f94fb")} onPress={() => navigation.navigate("Register")}>
          <Text style={buttonText}>Înregistrează-te</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[buttonStyle("#4e54c8"), { marginTop: 15 }]} onPress={() => navigation.navigate("Login")}>
          <Text style={buttonText}>Autentificare</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2025 CityHub. Toate drepturile rezervate.</Text>
    </LinearGradient>
  );
};

// Poziții pentru stele decorative
const stars = [
  { top: 60, left: 40 },
  { top: 100, left: 200 },
  { top: 150, left: 120 },
  { top: 200, left: 300 },
  { top: 250, left: 60 },
  { top: 80, left: 280 },
  { top: 300, left: 180 },
  { top: 120, left: 20 },
  { top: 50, left: 150 },
  { top: 180, left: 250 },
  { top: 220, left: 90 },
  { top: 280, left: 20 },
  { top: 320, left: 300 },
  { bottom: 100, right: 40 },
  { bottom: 150, left: 130 },
  { bottom: 200, right: 80 },
  { bottom: 60, left: 200 },
  { bottom: 30, right: 20 },
  { bottom: 120, right: 150 },
];
const shapedStars = [
  { top: 40, left: 50, symbol: "✧" },
  { top: 80, right: 30, symbol: "✦" },
  { top: 120, left: 100, symbol: "★" },
  { top: 160, right: 60, symbol: "✧" },
  { top: 200, left: 20, symbol: "✦" },
  { top: 240, right: 100, symbol: "★" },
  { top: 280, left: 160, symbol: "✧" },
  { top: 320, right: 50, symbol: "✦" },
  { bottom: 180, left: 40, symbol: "★" },
  { bottom: 140, right: 80, symbol: "✧" },
  { bottom: 100, left: 120, symbol: "✦" },
  { bottom: 60, right: 40, symbol: "✧" },
];


const styles = StyleSheet.create({
  shapedStar: {
    position: "absolute",
    fontSize: 12,
    color: "#e0e0e0",
  },
  
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    marginTop: 80,
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  slogan: {
    fontSize: 16,
    color: "#e0e0e0",
    marginTop: 4,
  },
  emojiRow: {
    fontSize: 22,
    marginTop: 12,
  },
  card: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 28,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  footer: {
    fontSize: 12,
    color: "#eeeeee",
    marginBottom: 20,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#cfd8dc", // argintiu deschis
  },
});

export default HomeScreen;
