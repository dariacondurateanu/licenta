import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const FavoriteLocationsScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    const userRef = doc(db, "users", "userID");
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().favorites) {
      setFavorites(userSnap.data().favorites);
    }
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>⭐ Locuri Favorite</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate("LocationDetailsScreen", { location: { id: item } })}>
            <Text style={{ fontSize: 18, marginTop: 10 }}>📍 {item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default FavoriteLocationsScreen;
