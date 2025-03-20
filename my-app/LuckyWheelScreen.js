import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import ConfettiCannon from "react-native-confetti-cannon";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useNavigation } from "@react-navigation/native";

const LuckyWheelScreen = () => {
  const [rotation, setRotation] = useState(new Animated.Value(0));
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (showConfetti) {
      confettiRef.current.start();
    }
  }, [showConfetti]);

  const spinWheel = async () => {
    setShowConfetti(false);
    setSelectedLocation(null);
    rotation.setValue(0);
  
    Animated.timing(rotation, {
      toValue: Math.random() * 360 + 1080,
      duration: 3000,
      useNativeDriver: true,
    }).start(async () => {
      // 1. Fetch locations din Firestore
      const snapshot = await getDocs(collection(db, "locations"));
      const allLocations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // 2. Filtrare doar cele deschise ACUM
      const now = new Date();
      const dayMap = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
      const today = dayMap[now.getDay()];
      const currentTime = now.getHours() + now.getMinutes() / 60;
  
      const openNow = allLocations.filter(loc => {
        const todayHours = loc.openingHours?.[today];
        if (!todayHours || todayHours === "Inchis") return false;
  
        const [startStr, endStr] = todayHours.replace("–", "-").split("-").map(t => t.trim());
        const parse = (str) => {
          const [h, m] = str.split(".");
          return parseInt(h) + (parseInt(m || 0) / 60);
        };
  
        const start = parse(startStr);
        let end = parse(endStr);
        if (end < start) end += 24;
  
        const adjusted = currentTime < start ? currentTime + 24 : currentTime;
        return adjusted >= start && adjusted <= end;
      });
  
      // 3. Alege una random doar din cele deschise
      if (openNow.length > 0) {
        const randomLocation = openNow[Math.floor(Math.random() * openNow.length)];
        setSelectedLocation(randomLocation);
        setShowConfetti(true);
      } else {
        alert("Nicio locație deschisă acum 😢");
      }
    });
  };
  
  

  // Creăm 12 segmente colorate pentru roată

  const radius = 100;
  // Modifică numărul de segmente și culorile
    const numSegments = 8;
    const colors = [
  "#FF3C38", // roșu vibrant
  "#2EC4B6", // turcoaz intens
  "#FF9F1C", // portocaliu aprins
  "#3A86FF", // albastru electric
  "#F15BB5", // roz fuchsia
  "#06D6A0", // verde smarald vibrant
  "#8338EC", // mov puternic
  "#FFD60A"  // galben neon
];

  const angle = (2 * Math.PI) / numSegments;

const segments = Array.from({ length: numSegments }, (_, i) => {
  const startAngle = i * angle;
  const endAngle = (i + 1) * angle;

  const x1 = radius + radius * Math.cos(startAngle);
  const y1 = radius + radius * Math.sin(startAngle);
  const x2 = radius + radius * Math.cos(endAngle);
  const y2 = radius + radius * Math.sin(endAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return (
    <Path
      key={i}
      d={`M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`}
      fill={colors[i % colors.length]}
    />
  );
});


  return (
    <View style={styles.container}>
      {/* Roata Norocului */}
      <View style={styles.wheelContainer}>
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          <Svg width={300} height={300} viewBox="0 0 200 200">
            {/* Desenează segmentele colorate */}
            <G>{segments}</G>
          </Svg>
        </Animated.View>

        {/* Buton rotire */}
        <TouchableOpacity style={styles.spinButton} onPress={spinWheel}>
          <Text style={styles.spinText}>🎲</Text>
        </TouchableOpacity>
      </View>

      {/* Confetti 🎉 */}
      {showConfetti && (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <ConfettiCannon
      count={100}
      origin={{ x: 200, y: 0 }} // chiar sus
      fadeOut={true}
      autoStart={true}
      fallSpeed={3000}
      explosionSpeed={500}
      ref={confettiRef}
    />
  </View>
)}


      {/* Rezultat locație aleasă */}
      {selectedLocation && (
  <TouchableOpacity
    style={styles.resultCard}
    onPress={() =>
      navigation.navigate("LocationDetails", { location: selectedLocation })
    }
  >
    <Image source={{ uri: selectedLocation.imageUrl }} style={styles.image} />
    <Text style={styles.name}>{selectedLocation.name}</Text>
    <Text style={styles.rating}>⭐ {selectedLocation.rating || "Fără rating"}</Text>
  </TouchableOpacity>
)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  wheelContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  spinButton: {
    position: "absolute",
    width: 60,
    height: 60,
    backgroundColor: "white",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  spinText: {
    fontSize: 28,
  },
  resultCard: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "80%",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  rating: {
    fontSize: 16,
    color: "gray",
    marginTop: 5,
  },
});

export default LuckyWheelScreen;
