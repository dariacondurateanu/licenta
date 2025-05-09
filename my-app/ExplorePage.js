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
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import MapView, { Marker, Callout } from "react-native-maps";


const { width } = Dimensions.get("window");

const ExplorePage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAnim] = useState(new Animated.Value(-width * 0.6));
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suggestedNow, setSuggestedNow] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Toggle drawer
  const toggleDrawer = () => {
    const toValue = drawerOpen ? -width * 0.6 : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setDrawerOpen(!drawerOpen);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "locations"));
      const allLocations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const uniqueTypes = new Set();
      allLocations.forEach((loc) => {
        if (loc.type) uniqueTypes.add(loc.type);
      });

      setCategories([...uniqueTypes]);
      setLocations(allLocations);

      const now = new Date();
      const dayMap = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
      const today = dayMap[now.getDay()];
      const currentTime = now.getHours() + now.getMinutes() / 60;

      const openNow = allLocations.filter((loc) => {
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
  const getIconForType = (type) => {
    switch (type) {
      case "club": return "musical-notes-outline";
      case "coffee shop": return "cafe-outline";
      case "cocktail bar": return "wine-outline";
      case "restaurant": return "restaurant-outline";
      default: return "apps-outline";
    }
  };
  
  const handleCategoryPress = (type) => {
    setSelectedType(type);
    toggleDrawer();
    setSearchQuery("");
  };

  const filteredLocations = selectedType
  ? locations.filter(
      (loc) =>
        loc.type &&
        loc.type.trim().toLowerCase() === selectedType.trim().toLowerCase()
    )
  : [];

  const renderCategory = ({ item }) => {
    const iconName = getIconForType(item);
    const isSelected = selectedType === item; // verifică dacă e categoria selectată
  
    return (
      <TouchableOpacity
        style={styles.categoryButton}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        {/* 🔹 Linia mov laterală */}
        <View style={{
          height: "100%",
          width: 5,
          backgroundColor: isSelected ? "#2e2e60" : "transparent",
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
          marginRight: 10
        }} />
  
        {/* 🔹 Icon + Text */}
        <Ionicons name={iconName} size={20} color="#2e2e60" style={{ marginRight: 12 }} />
        <Text style={styles.categoryText}>{translateTypeToName(item)}</Text>
      </TouchableOpacity>
    );
  };
  

  const renderSuggestedCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("LocationDetails", { location: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardRating}>⭐ {item.rating || "Fără rating momentan"}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilteredCard = ({ item }) => {
    if (!item || !item.name) return null;
    return (
      <TouchableOpacity
        style={[styles.filteredCard, { marginBottom: 20 }]}
        onPress={() => navigation.navigate("LocationDetails", { location: item })}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: 150 }} />
        ) : (
          <View style={{ width: "100%", height: 150, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#888" }}>Fără imagine</Text>
          </View>
        )}
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
          <Text>⭐ {item.rating || "Fără rating momentan"}</Text>
        </View>
        <View style={styles.cardBottomBar} />
      </TouchableOpacity>
    );
  };
  

  return (
<LinearGradient
  colors={["#d9dbf8", "#f3f4fd", "#ffffff"]}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={{ flex: 1 }}
>
    <View style={{ flex: 1, paddingBottom: 20 }}>
      {/* Bara sus */}
      <LinearGradient
  colors={["#1a1a2e", "#2e2e60"]}
  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderRadius: 10, margin: 20 }}
>

        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={30} color="white" />
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
          <Text style={{ fontSize: 12, color: "#fff" }}>Alege local</Text>
        </TouchableOpacity>
    </LinearGradient>

      {/* Drawer */}
      {drawerOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={toggleDrawer} />}
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
          <TouchableOpacity onPress={() => { toggleDrawer(); navigation.navigate("MyReservationsScreen"); }} style={{ marginBottom: 20, alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={36} color="#2e2e60" />
            <Text style={{ fontSize: 16, fontWeight: "500", color: "#2e2e60", marginTop: 5 }}>Rezervările mele</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { toggleDrawer(); navigation.navigate("AccountDetailsScreen"); }} style={{ alignItems: "center" }}>
            <Ionicons name="person-circle-outline" size={40} color="#2e2e60" />
            <Text style={{ fontSize: 16,fontWeight: "500", color: "#2e2e60", marginTop: 5 }}>Detalii cont</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Căutare */}
      <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
  <View style={styles.searchBar}>
    <Ionicons name="search" size={20} color="#fff" style={{ marginLeft: 10 }} />
    <TextInput
      placeholder="Caută un local..."
      placeholderTextColor="#ccc"
      value={searchQuery}
      onChangeText={setSearchQuery}
      style={styles.searchInputColored}
    />
  </View>
</View>


      {/* Rezultate căutare */}
      {searchQuery.length > 0 && (
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Rezultate pentru: "{searchQuery}"
          </Text>
          <FlatList
            data={locations.filter(loc =>
              (!selectedType || loc.type === selectedType) &&
              typeof loc.name === "string" &&
              loc.name.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item.id}
            renderItem={renderFilteredCard}
            ListEmptyComponent={<Text style={{ marginTop: 10, fontStyle: "italic", color: "#666" }}>Nu am găsit niciun rezultat.</Text>}
          />
        </View>
      )}

      {/* Sugestii */}
      {!selectedType && !searchQuery && suggestedNow.length > 0 && (
        <View style={{ marginBottom: 20, marginTop: 20 }}>
          <Text style={styles.sectionTitle}>🔥 Sugestii pentru tine</Text>
          <View style={{ height: 8}} />
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
{selectedType && !searchQuery && (
  <View style={{ flex: 1, paddingHorizontal: 20 }}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 , marginTop: 7}}>
      
  <TouchableOpacity onPress={() => setSelectedType(null)} style={{ marginRight: 10 }}>
    <Text style={{ fontSize: 20 }}>🔙</Text>
  </TouchableOpacity>
  <Text style={{ fontSize: 20, fontWeight: "bold" }}>
    {translateTypeToName(selectedType)}
  </Text>
</View>
<View style={{ height: 6}} />
    <FlatList
      data={filteredLocations}
      keyExtractor={(item) => item.id}
      renderItem={renderFilteredCard}
      ListEmptyComponent={
        <Text style={{ marginTop: 10, color: "#888" }}>
          Nu există locații pentru această categorie.
        </Text>
      }
    />
  </View>
)}

      {/* Harta */}
      {!selectedType && !searchQuery && (
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
            {locations
              .filter(loc => loc.latitude && loc.longitude)
              .map(loc => (
                <Marker
                  key={loc.id}
                  coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                  onPress={() => navigation.navigate("LocationDetails", { location: loc })}
                >
                  <Callout tooltip>
                    <View style={{ backgroundColor: "white", padding: 8, borderRadius: 8, maxWidth: 200 }}>
                      {typeof loc.name === "string" && (
                        <Text style={{ fontWeight: "bold", fontSize: 14, marginBottom: 4 }}>{loc.name}</Text>
                      )}
                      <Text style={{ fontSize: 13 }}>
                        ⭐ {typeof loc.rating === "number" ? loc.rating : "Fără rating"}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
          </MapView>
        </View>
      )}
      </View>
 </LinearGradient>
  );
};

// Styles
const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e2e60",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchInputColored: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#fff",
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 10,
  },
  card: {
    width: width * 0.7,
    marginRight: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    borderBottomWidth: 4,
    borderBottomColor: "#2e2e60",

  },
  cardImage: {
    width: "100%",
    height: 130,
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
    width: width * 0.6,
    backgroundColor: "#fff",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 0 },
    shadowRadius: 5,
    elevation: 5,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18, // era 14
    paddingHorizontal: 24, // puțin mai lat și pe lateral
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  
  categoryText: {
    fontSize: 18, // era 17
    fontWeight: "500",
    color: "#2e2e60",
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
    bottom: 60, // mai sus decât era
    left: 0,
    right: 0,
    alignItems: "center", // centrăm perfect pe orizontală
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  cardBottomBar: {
    height: 6,
    backgroundColor: "#2e2e60",
    marginTop: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});

export default ExplorePage;
