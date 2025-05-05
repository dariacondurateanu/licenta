import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Animated,
  Platform,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, { G, Path } from "react-native-svg";
import { ScrollView } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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

      // În handleSearch:
if (selectedRating) {
  const selected = parseFloat(selectedRating);
  filtered = filtered.filter((loc) => {
    const rating = parseFloat(loc.rating);
    if (selected === 5) {
      return rating === 5; // exact 5
    }
    return rating >= selected;
  });
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
        {item.rating ? `⭐ ${item.rating}` : "⭐ Fără rating momentan"}
      </Text>
      <View style={styles.resultCardBar} />
    </TouchableOpacity>
  );
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        style={{ padding: 15 }}
        contentContainerStyle={{ paddingBottom: 10 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        <Text style={styles.label}>
  <Icon name="storefront-outline" size={18} color="#6A0DAD" /> Categorie:
</Text>

{[
  { key: "restaurant", icon: "silverware-fork-knife" },
  { key: "club", icon: "music" },
  { key: "coffee shop", icon: "coffee" },
  { key: "cocktail bar", icon: "glass-cocktail" },
].map(({ key, icon }) => {
  const selected = selectedCategory === key;
  return (
    <TouchableOpacity
      key={key}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={() => setSelectedCategory(toggleSelect(selectedCategory, key))}
    >
      <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
        <Icon name={icon} size={20} color={selected ? "#4a148c" : "white"} />
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {key.charAt(0).toUpperCase() + key.slice(1)}
      </Text>
    </TouchableOpacity>
  );
})}



<Text style={styles.label}>
  <Icon name="star-outline" size={18} color="#6A0DAD" /> Rating minim:
</Text>

{["5", "4.5", "4", "3.5"].map((rate) => {
  const selected = selectedRating === rate;
  return (
    <TouchableOpacity
      key={rate}
      style={[
        styles.optionCard,
        selected && styles.optionCardSelected,
      ]}
      onPress={() => setSelectedRating(toggleSelect(selectedRating, rate))}
    >
      <View style={[
        styles.iconWrapper,
        selected && styles.iconWrapperSelected
      ]}>
        <Icon
          name="star"
          size={18}
          color={selected ? "#4a148c" : "white"}
        />
      </View>
      <Text style={[
        styles.optionText,
        selected && styles.optionTextSelected
      ]}>
        {rate === "5" ? "5⭐" : `Peste ${rate}⭐`}
      </Text>
    </TouchableOpacity>
  );
})}




<Text style={styles.label}>
  <Icon name="cash-multiple" size={18} color="#6A0DAD" /> Preț mediu:
</Text>

{["$", "$$", "$$$"].map((val) => {
  const selected = selectedPrice === val;
  return (
    <TouchableOpacity
      key={val}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={() => setSelectedPrice(toggleSelect(selectedPrice, val))}
    >
      <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
        <Icon name="currency-usd" size={18} color={selected ? "#4a148c" : "white"} />
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {val}
      </Text>
    </TouchableOpacity>
  );
})}



<Text style={styles.label}>
  <Icon name="party-popper" size={18} color="#6A0DAD" /> Activități speciale:
</Text>

{[
  { key: "terasa", icon: "weather-sunny" },
  { key: "karaoke", icon: "microphone" },
  { key: "board games", icon: "gamepad-variant" },
  { key: "laptop friendly", icon: "laptop" },
  { key: "pet friendly", icon: "dog" },
].map(({ key, icon }) => {
  const selected = selectedActivities.includes(key);
  return (
    <TouchableOpacity
      key={key}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={() => toggleActivity(key)}
    >
      <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
        <Icon name={icon} size={18} color={selected ? "#4a148c" : "white"} />
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {key}
      </Text>
    </TouchableOpacity>
  );
})}



<View style={{ borderTopWidth: 1, borderColor: "#ddd", marginVertical: 20 }} />
<Text style={styles.label}>
  <Icon name="clock-time-four-outline" size={18} color="#6A0DAD" /> Disponibilitate:
</Text>

<TouchableOpacity
  style={[styles.optionCard, openNow && styles.optionCardSelected]}
  onPress={() => setOpenNow((prev) => !prev)}
>
  <View style={[styles.iconWrapper, openNow && styles.iconWrapperSelected]}>
    <Icon name="clock-check-outline" size={18} color={openNow ? "#4a148c" : "white"} />
  </View>
  <Text style={[styles.optionText, openNow && styles.optionTextSelected]}>
    Doar locații deschise acum
  </Text>
</TouchableOpacity>



<TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
  <Text style={styles.searchBtnText}>🔍 Găsește locații</Text>
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
      <Text style={styles.wheelText}>Încă nu știi ce vrei?</Text>
      <Text style={styles.wheelSubtext}>Apasă roata surprizelor</Text>
    </TouchableOpacity>
    
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  label: {
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    color: "#4a148c", // mov închis
    textAlign: "left",
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4a148c",
    marginBottom: 12,
    backgroundColor: "white",
    alignSelf: "flex-start",          // ✅ aliniere pe stânga și scurtare
  },
  categoryCardSelected: {
    backgroundColor: "#4a148c",
  },
  categoryText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#4a148c",
    textTransform: "capitalize",
  },
  categoryTextSelected: {
    color: "white",
  },
  
  checkboxContainer: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4a148c",
    backgroundColor: "white",
    marginVertical: 8,
    alignItems: "flex-start",
    alignSelf: "flex-start",           // ✅ butonul nu va mai ocupa toată lățimea
  },
  checkboxContainerSelected: {
    backgroundColor: "#4a148c",
  },
  checkboxText: {
    fontSize: 16,
    color: "#4a148c",
    fontWeight: "bold",
  },
  checkboxTextSelected: {
    color: "white",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    color: "#4a148c",
    textAlign: "left",
  },
  resultCard: {
    backgroundColor: "#f9f0fb", // fundal alb
    borderRadius: 18,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    height: 160,
    width: "100%",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  rating: {
    fontSize: 14,
    color: "#444",
    paddingHorizontal: 12,
    paddingBottom: 16,
    flexDirection: "row",
  },
  resultCardBar: {
    height: 6,
    backgroundColor: "#4a148c", // mov închis
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  searchBtn: {
    backgroundColor: "#4a148c",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 24,
  },
  searchBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  floatingWheelPreview: {
    position: "absolute",
    top: Platform.OS === "ios" ? 10 : 80, // ⬆️ mai jos, dar tot sus
    right: 16,
    width: 160,
    padding: 0,
    borderRadius: 20,
    backgroundColor: "f7f1fb",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
    alignItems: "center",
  },
  
  
  wheelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a148c",
    textAlign: "center",
    marginTop: 8,
  },
  wheelSubtext: {
    fontSize: 11,
    color: "#777",
    textAlign: "center",
    marginTop: 2,
  },
  optionCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f7f1fb", // lavandă deschis
  padding: 14,
  marginVertical: 8,
  borderRadius: 16,
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 3,
  elevation: 2,
  width: "98%",
  alignSelf: "flex-start",
},
optionCardSelected: {
  backgroundColor: "#4a148c",
},
iconWrapper: {
  backgroundColor: "#d7bafc",
  padding: 6,
  borderRadius: 8,
  marginRight: 12,
},
iconWrapperSelected: {
  backgroundColor: "white",
},
optionText: {
  fontSize: 16,
  fontWeight: "600",
  color: "#4a148c",
},
optionTextSelected: {
  color: "white",
},

});



export default SurpriseMeScreen;
