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


const { width } = Dimensions.get("window");

const ExplorePage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAnim] = useState(new Animated.Value(-width * 0.5));
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const navigation = useNavigation();

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

      // Extrage tipuri unice
      const uniqueTypes = new Set();
      allLocations.forEach((loc) => {
        if (loc.type) uniqueTypes.add(loc.type);
      });

      setCategories([...uniqueTypes]);
      setLocations(allLocations);
    } catch (error) {
      console.error("Eroare la fetch:", error);
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchData(); // 🔄 Reîncarcă datele de fiecare dată când ecranul devine activ
    }
  }, [isFocused]);
  

  const translateTypeToName = (type) => {
    switch (type) {
      case "club":
        return "Cluburi";
      case "coffee shop":
        return "Cafenele";
      case "cocktail bar":
        return "Cocktail baruri";
      case "restaurant":
        return "Restaurante";
      default:
        return "Diverse";
    }
  };

  const handleCategoryPress = (type) => {
    setSelectedType(type);
    toggleDrawer(); // închide drawer-ul
  };

  const filteredLocations = selectedType
    ? locations.filter((loc) => loc.type === selectedType)
    : locations;

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryButton}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.categoryText}>{translateTypeToName(item)}</Text>
    </TouchableOpacity>
  );

  const renderLocation = ({ item }) => (
    <TouchableOpacity
      style={{
        marginBottom: 15,
        backgroundColor: "#f8f8f8",
        borderRadius: 8,
        overflow: "hidden",
      }}
      onPress={() => navigation.navigate("LocationDetails", { location: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: 150 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 10,
        }}
      >
        <View>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
          <Text>
  {item.rating && item.rating > 0
    ? `⭐ ${item.rating}`
    : "⭐ Fără rating momentan"}
</Text>

        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", margin: 20 }}>
  {/* Meniu (hamburger) */}
  <TouchableOpacity onPress={toggleDrawer}>
    <Ionicons name="menu" size={30} color="black" />
  </TouchableOpacity>

  {/* Inimioară pentru favorite */}
  <TouchableOpacity
    onPress={() => navigation.navigate("FavouritesScreen")}
    style={{ position: "absolute", left: "50%", transform: [{ translateX: -15 }] }}
  >
    <Ionicons name="heart" size={30} color="red" />
  </TouchableOpacity>
</View>

      {/* Overlay când drawer-ul e deschis */}
      {drawerOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDrawer}
        />
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { left: drawerAnim }]}>
        {/* Buton X */}
        <TouchableOpacity onPress={toggleDrawer} style={styles.closeButton}>
          <Ionicons name="close" size={30} color="#333" />
        </TouchableOpacity>

        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingTop: 60 }}
        />

        {/* Detalii cont */}
        <View style={styles.accountSection}>
          <Ionicons name="person-circle-outline" size={40} color="#333" />
          <Text style={{ fontSize: 16, marginTop: 5 }}>Detalii cont</Text>
        </View>
      </Animated.View>

      {/* Conținut principal */}
      <View style={{ flex: 1, padding: 20 }}>
        {selectedType && (
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            {translateTypeToName(selectedType)}
          </Text>
        )}

        <FlatList
          data={filteredLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderLocation}
          ListEmptyComponent={<Text>Nu există locații disponibile.</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  accountSection: {
    position: "absolute",
    bottom: 30,
    left: 20,
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 5,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 11,
  },
});

export default ExplorePage;
