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
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Se încarcă favoritele...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
      ❤️  Localuri Favorite
      </Text>
      {favoriteLocations.length === 0 ? (
        <Text>Nu ai locații favorite.</Text>
      ) : (
        <FlatList
          data={favoriteLocations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                marginBottom: 15,
                backgroundColor: "#f8f8f8",
                borderRadius: 8,
                overflow: "hidden",
              }}
              onPress={() =>
                navigation.navigate("LocationDetails", { location: item })
              }
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: "100%", height: 150 }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 10,
                }}
              >
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    {item.name}
                  </Text>
                  <Text>⭐ {item.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default FavoriteLocationsScreen;
