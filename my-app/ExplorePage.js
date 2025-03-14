import React, { useState, useEffect } from "react";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

const ExplorePage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAnim] = useState(new Animated.Value(-width * 0.5));
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suggestedNow, setSuggestedNow] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const toggleDrawer = () => {
    const toValue = drawerOpen ? -width * 0.5 : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setDrawerOpen(!drawerOpen);
  };

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "locations"));
      const allLocations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const uniqueTypes = new Set();
      allLocations.forEach(loc => {
        if (loc.type) uniqueTypes.add(loc.type);
      });

      setCategories([...uniqueTypes]);
      setLocations(allLocations);

      const now = new Date();
      const dayMap = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
      const today = dayMap[now.getDay()];
      const currentTime = now.getHours() + now.getMinutes() / 60;

      const openNow = allLocations.filter(loc => {
        const todayHours = loc.openingHours?.[today];
        if (!todayHours || todayHours === "Inchis") return false;

        const [startStr, endStr] = todayHours.replace("–", "-").split("-").map(t => t.trim());
        const parse = str => {
          const [h, m] = str.split(".");
          return parseInt(h) + (parseInt(m || 0) / 60);
        };

        const start = parse(startStr);
        let end = parse(endStr);
        if (end < start) end += 24;

        const adjusted = currentTime < start ? currentTime + 24 : currentTime;
        return adjusted >= start && adjusted <= end;
      });

      const top5 = openNow.sort((a, b) => b.rating - a.rating).slice(0, 5);
      setSuggestedNow(top5);
    } catch (error) {
      console.error("Eroare la fetch:", error);
    }
  };

  useEffect(() => {
    if (isFocused) fetchData();
  }, [isFocused]);

  const translateTypeToName = (type) => {
    switch (type) {
      case "club": return "Cluburi";
      case "coffee shop": return "Cafenele";
      case "cocktail bar": return "Cocktail baruri";
      case "restaurant": return "Restaurante";
      default: return "Diverse";
    }
  };

  const handleCategoryPress = (type) => {
    setSelectedType(type);
    toggleDrawer();
  };

  const filteredLocations = selectedType
    ? locations.filter(loc => loc.type === selectedType)
    : [];

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryButton}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.categoryText}>{translateTypeToName(item)}</Text>
    </TouchableOpacity>
  );

  const renderSuggestedCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("LocationDetails", { location: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardRating}>⭐ {item.rating || "Fără rating"}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilteredCard = ({ item }) => (
    <TouchableOpacity
      style={styles.filteredCard}
      onPress={() => navigation.navigate("LocationDetails", { location: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: 150 }} />
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
        <Text>⭐ {item.rating || "Fără rating momentan"}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      {/* Bara sus */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", margin: 20 }}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("FavouritesScreen")}
          style={{ position: "absolute", left: "50%", transform: [{ translateX: -15 }] }}
        >
          <Ionicons name="heart" size={30} color="red" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("SurpriseMe")}
          style={{ alignItems: "center", marginRight: 10 }}
        >
          <Text style={{ fontSize: 24 }}>🎲</Text>
          <Text style={{ fontSize: 12 }}>Alege local</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay drawer */}
      {drawerOpen && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleDrawer} />
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="#333" />
        </TouchableOpacity>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingTop: 60 }}
        />
        <View style={styles.accountSection}>
          <Ionicons name="person-circle-outline" size={40} color="#333" />
          <Text style={{ fontSize: 16, marginTop: 5 }}>Detalii cont</Text>
        </View>
      </Animated.View>

      {/* Sugestii – doar dacă NU avem tip selectat */}
      {!selectedType && suggestedNow.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>🔥 Sugestii pentru tine</Text>
          <View style={{ height: 20}} />
          <FlatList
            data={suggestedNow}
            renderItem={renderSuggestedCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>
      )}

      {/* Locații filtrate */}
      {selectedType && (
  <View style={{ flex: 1, paddingHorizontal: 20 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        {translateTypeToName(selectedType)}
      </Text>
      <TouchableOpacity onPress={() => setSelectedType(null)}>
        <Text style={{ fontSize: 14, color: "#007bff" }}>🔙 Înapoi</Text>
      </TouchableOpacity>
    </View>

    <FlatList
      data={filteredLocations}
      keyExtractor={(item) => item.id}
      renderItem={renderFilteredCard}
      ListEmptyComponent={<Text>Nu există locații disponibile.</Text>}
    />
    
  </View>
)}
<View style={{ height: 20 }} />

{/* Harta – se afișează doar dacă nu e selectat un tip */} 
{!selectedType && (
  <View style={{ height: 300, marginBottom: 20, marginHorizontal: 20, borderRadius: 10, overflow: "hidden" }}>
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 44.4268,
        longitude: 26.1025,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }}
    >
      {locations.map((loc) =>
        loc.latitude && loc.longitude && (
          <Marker
            key={loc.id}
            coordinate={{
              latitude: loc.latitude,
              longitude: loc.longitude,
            }}
            title={loc.name}
            description={`⭐ ${loc.rating || "Fără rating"}`}
            onPress={() => navigation.navigate("LocationDetails", { location: loc })}
          />
        )
      )}
    </MapView>
  </View>
)}

    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
  },
  card: {
    width: width * 0.7,
    marginRight: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 130,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardRating: {
    marginTop: 5,
    fontSize: 16,
    color: "black",
  },
  filteredCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: width * 0.5,
    backgroundColor: "#fff",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 0 },
    shadowRadius: 5,
    elevation: 5,
  },
  categoryButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  categoryText: {
    fontSize: 18,
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 5,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 11,
  },
  accountSection: {
    position: "absolute",
    bottom: 30,
    left: 20,
    alignItems: "center",
  },
});

export default ExplorePage;
