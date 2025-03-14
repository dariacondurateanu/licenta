import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Animated,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, { G, Path } from "react-native-svg";
import { ScrollView } from "react-native-gesture-handler";

const MiniWheel = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const numSegments = 8;
  const radius = 30;
  const angle = (2 * Math.PI) / numSegments;
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
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Svg width={60} height={60} viewBox="0 0 60 60">
        <G>{segments}</G>
      </Svg>
    </Animated.View>
  );
};

const SurpriseMeScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedPrice, setSelectedPrice] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [results, setResults] = useState([]);
  const [showWheel, setShowWheel] = useState(true);

  const navigation = useNavigation();

  const toggleSelect = (current, value) =>
    current === value ? "" : value;

  const toggleActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowWheel(offsetY < 150);
  };

  const handleSearch = async () => {
    try {
      const snapshot = await getDocs(collection(db, "locations"));
      const allLocations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let filtered = allLocations;

      if (selectedCategory) {
        filtered = filtered.filter((loc) => loc.type === selectedCategory);
      }

      if (selectedRating) {
        filtered = filtered.filter(
          (loc) => loc.rating >= parseFloat(selectedRating)
        );
      }

      if (selectedPrice) {
        filtered = filtered.filter(
          (loc) => loc.priceRange === selectedPrice
        );
      }

      if (selectedActivities.length > 0) {
        filtered = filtered.filter((loc) =>
          selectedActivities.every((activity) =>
            Array.isArray(loc.activities) &&
            loc.activities.includes(activity)
          )
        );
      }

      if (openNow) {
        const now = new Date();
        const dayMap = [
          "Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"
        ];
        const today = dayMap[now.getDay()];
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHour + currentMinutes / 60;

        filtered = filtered.filter((loc) => {
          const todayHours = loc.openingHours?.[today];
          if (!todayHours || todayHours === "Inchis") return false;

          const [rawStart, rawEnd] = todayHours.replace("–", "-").split("-").map(s => s.trim());
          const parseTime = (timeStr) => {
            const [hourStr, minStr] = timeStr.split(".");
            return parseInt(hourStr) + (parseInt(minStr) / 60);
          };

          const start = parseTime(rawStart);
          let end = parseTime(rawEnd);
          if (end < start) end += 24;
          const adjustedTime = currentTime < start ? currentTime + 24 : currentTime;

          return adjustedTime >= start && adjustedTime <= end;
        });
      }

      const sorted = filtered.sort((a, b) => b.rating - a.rating);
      setResults(sorted);
    } catch (error) {
      console.error("❌ Eroare la filtrare: ", error);
    }
  };

  const renderResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate("LocationDetails", { location: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.rating}>
        {item.rating ? `⭐ ${item.rating}` : "Fără rating momentan"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        style={{ padding: 15 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.heading}>🎯 Alege preferințele tale</Text>

        <Text style={styles.label}>Categorie:</Text>
        {["restaurant", "club", "coffee shop", "cocktail bar"].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={styles.checkboxContainer}
            onPress={() => setSelectedCategory(toggleSelect(selectedCategory, cat))}
          >
            <Text style={styles.checkboxText}>
              {selectedCategory === cat ? "✅" : "⬜️"} {cat}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Rating minim:</Text>
        {["5", "4.5", "4", "3.5"].map((rate) => (
          <TouchableOpacity
            key={rate}
            style={styles.checkboxContainer}
            onPress={() => setSelectedRating(toggleSelect(selectedRating, rate))}
          >
            <Text style={styles.checkboxText}>
              {selectedRating === rate ? "✅" : "⬜️"} peste {rate}⭐
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Preț mediu:</Text>
        {["$", "$$", "$$$"].map((val) => (
          <TouchableOpacity
            key={val}
            style={styles.checkboxContainer}
            onPress={() => setSelectedPrice(toggleSelect(selectedPrice, val))}
          >
            <Text style={styles.checkboxText}>
              {selectedPrice === val ? "✅" : "⬜️"} {val}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Activități speciale:</Text>
        {["terasa", "karaoke", "board games", "laptop friendly"].map((act) => (
          <TouchableOpacity
            key={act}
            style={styles.checkboxContainer}
            onPress={() => toggleActivity(act)}
          >
            <Text style={styles.checkboxText}>
              {selectedActivities.includes(act) ? "✅" : "⬜️"} {act}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ borderTopWidth: 1, borderColor: "#ddd", marginVertical: 10 }} />
        <Text style={styles.label}>Disponibilitate:</Text>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setOpenNow((prev) => !prev)}
        >
          <Text style={styles.checkboxText}>
            {openNow ? "✅" : "⬜️"} Doar locații deschise acum
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            🔍 Găsește locații
          </Text>
        </TouchableOpacity>

        {results.length > 0 && (
          <>
            <Text style={styles.heading}>📍 Rezultate:</Text>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderResult}
              scrollEnabled={false}
            />
          </>
        )}

        {results.length === 0 && (
          <Text style={{ marginTop: 20, fontStyle: "italic", color: "gray" }}>
            🔎 Nu au fost găsite rezultate momentan.
          </Text>
        )}
      </ScrollView>

      {showWheel && (
        <TouchableOpacity
          style={styles.floatingWheelPreview}
          onPress={() => navigation.navigate("LuckyWheel")}
        >
          <MiniWheel />
          <Text style={styles.wheelText}>Încă nu te-ai{"\n"}hotărât?</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
  checkboxContainer: {
    marginVertical: 5,
  },
  checkboxText: {
    fontSize: 15,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  resultCard: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  image: {
    height: 150,
    width: "100%",
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  rating: {
    fontSize: 14,
    color: "black",
  },
  searchBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  floatingWheelPreview: {
    position: "absolute",
    right: 10,
    top: 170,
    alignItems: "center",
    zIndex: 100,
  },
  wheelText: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
    marginTop: 7,
  },
});

export default SurpriseMeScreen;
