import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db ,auth} from "./firebaseConfig"; 
import { useNavigation } from "@react-navigation/native";

const LocationsListScreen = () => {
  const [locations, setLocations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid; 

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const locationsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocations(locationsArray);
      } catch (error) {
        console.error("Eroare la citirea locațiilor:", error);
      }
    };

    const fetchFavorites = async () => {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setFavorites(userSnap.data().favorites || []);
      }
    };

    fetchLocations();
    fetchFavorites();
  }, []);

  const toggleFavorite = async (locationId) => {
    const userRef = doc(db, "users", userId);
    try {
      if (favorites.includes(locationId)) {
        await updateDoc(userRef, {
          favorites: arrayRemove(locationId),
        });
        setFavorites(favorites.filter(id => id !== locationId));
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(locationId),
        });
        setFavorites([...favorites, locationId]);
      }
    } catch (error) {
      console.error("❌ Eroare la actualizarea favorite:", error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {locations.length === 0 ? (
        <Text style={{ textAlign: "center", fontSize: 18 }}>Nu există locații disponibile</Text>
      ) : (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                marginBottom: 15,
                backgroundColor: "#f8f8f8",
                borderRadius: 8,
                overflow: "hidden",
              }}
              onPress={() => navigation.navigate("LocationDetails", { location: item })}
            >
              {/* Imaginea locației */}
              <Image source={{ uri: item.imageUrl }} style={{ width: "100%", height: 150 }} />

              {/* Container pentru nume, rating și buton favorite */}
              <View 
                style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: 10 
                }}
              >
                {/* Nume și rating */}
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
                  <Text>⭐ {item.rating}</Text>
                </View>

                {/* Buton de Favorite */}
                <TouchableOpacity 
                  onPress={() => toggleFavorite(item.id)}
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Text style={{ fontSize: 22, color: "black" }}>
                    {favorites.includes(item.id) ? "⭐" : "☆"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default LocationsListScreen;
