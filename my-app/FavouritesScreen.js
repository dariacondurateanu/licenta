import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";

const FavoriteLocationsScreen = ({ navigation }) => {
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchFavoriteLocations();
  }, []);

  const fetchFavoriteLocations = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }

      const favoriteIds = userSnap.data().favorites || [];

      const allLocationsSnap = await getDocs(collection(db, "locations"));
      const allLocations = allLocationsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filtered = allLocations.filter((loc) => favoriteIds.includes(loc.id));
      setFavoriteLocations(filtered);
    } catch (error) {
      console.error("Eroare la încărcarea locațiilor favorite:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6a5acd" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#2e2e60" }}>Se încarcă favoritele...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
  colors={["#d9dbf8", "#f3f4fd"]} // constant pe toată înălțimea
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={{ flex: 1 }}
>

      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#black", marginBottom: 20 }}>
          ❤️ Localuri Favorite
        </Text>

        {favoriteLocations.length === 0 ? (
          <Text style={{ fontSize: 16, color: "#666" }}>Nu ai locații favorite.</Text>
        ) : (
          <FlatList
            data={favoriteLocations}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  marginBottom: 20,
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  overflow: "hidden",
                  elevation: 3,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 5,
                }}
                onPress={() =>
                  navigation.navigate("LocationDetails", { location: item })
                }
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: "100%", height: 160 }}
                  resizeMode="cover"
                />
                <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#black" }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 15, color: "#black", marginTop: 4 }}>
                    ⭐ {item.rating || "Fără rating"}
                  </Text>
                </View>
                <View
    style={{
      height: 6,
      backgroundColor: "#2e2e60",
      width: "100%",
    }}
  />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default FavoriteLocationsScreen;
