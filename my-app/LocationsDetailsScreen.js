import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Button, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from "react-native";

import { useNavigation, useIsFocused } from "@react-navigation/native";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { db , auth} from "./firebaseConfig"; 
import { Linking } from "react-native";


const LocationDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { location } = route.params || {};
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRating, setNewRating] = useState("");
  const [newComment, setNewComment] = useState(""); 
  const [isFavorite, setIsFavorite] = useState(false);


  useEffect(() => {
    const fetchLocation = async () => {
      if (!location?.id) return;
      setLoading(true);

      const locationRef = doc(db, "locations", location.id);
      const docSnap = await getDoc(locationRef);

      if (docSnap.exists()) {
        setLocationData(docSnap.data());
      }
      checkIfFavorite();
      setLoading(false);
    };

    fetchLocation();
  }, [isFocused]);

    // ✅ Verifică dacă locația este deja la favorite
    const checkIfFavorite = async () => {
      const userId = auth.currentUser?.uid;
      const userRef = doc(db, "users", userId); 
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().favorites?.includes(location.id)) {
        setIsFavorite(true);
      }
    };
  
    // ✅ Adaugă/Șterge locația din favorite
    const toggleFavorite = async () => {
      const userId = auth.currentUser?.uid;
      const userRef = doc(db, "users", userId); // 🔹 Înlocuiește "userID" cu ID-ul real al utilizatorului
  
      try {
        if (isFavorite) {
          await updateDoc(userRef, {
            favorites: arrayRemove(location.id),
          });
          setIsFavorite(false);
          Alert.alert("❌ Eliminat din favorite!");
        } else {
          await updateDoc(userRef, {
            favorites: arrayUnion(location.id),
          });
          setIsFavorite(true);
          Alert.alert("⭐ Adăugat la favorite!");
        }
      } catch (error) {
        console.error("❌ Eroare la modificarea favorite:", error);
      }
    };
  const timeAgo = (timestamp) => {
    if (!timestamp) return "";
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval}y ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval}m ago`;

    interval = Math.floor(seconds / 604800);
    if (interval > 1) return `${interval}w ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;

    return "Just now";
  };
  const openInMaps = () => {
    if (locationData?.latitude && locationData?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`;
      Linking.openURL(url).catch(err => Alert.alert("Eroare", "Nu am putut deschide harta."));
    } else {
      Alert.alert("Locația nu este disponibilă.");
    }
  };

  const handleDeleteReview = async (review) => {
    Alert.alert(
      "Confirmare",
      "Sigur vrei să ștergi această recenzie?",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          onPress: async () => {
            try {
              const locationRef = doc(db, "locations", location.id);
              await updateDoc(locationRef, {
                reviews: arrayRemove(review),
              });
              Alert.alert("✅ Recenzie ștearsă!");
              setLocationData((prevData) => ({
                ...prevData,
                reviews: prevData.reviews.filter((r) => r !== review),
              }));
            } catch (error) {
              console.error("❌ Eroare la ștergerea recenziei: ", error);
              Alert.alert("Eroare! Încearcă din nou.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const [editingReview, setEditingReview] = useState(null);

const handleEditReview = (review) => {
  setEditingReview(review);
  setNewRating(review.rating.toString());
  setNewComment(review.comment);
  setModalVisible(true);
};

  const saveEditedReview = async () => {
    const numericRating = parseInt(newRating);
  
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      Alert.alert("❗ Ratingul trebuie să fie un număr între 1 și 5!");
      return;
    }
  
    if (!newComment.trim()) {
      Alert.alert("❗ Recenzia nu poate fi goală!");
      return;
    }
  
    try {
      const locationRef = doc(db, "locations", location.id);
      await updateDoc(locationRef, {
        reviews: arrayRemove(editingReview),
      });
  
      const updatedReview = {
        ...editingReview,
        rating: numericRating,
        comment: newComment,
        timestamp: editingReview.timestamp,
      };
  
      await updateDoc(locationRef, {
        reviews: arrayUnion(updatedReview),
      });
  
      setLocationData((prevData) => ({
        ...prevData,
        reviews: prevData.reviews.map((r) =>
          r === editingReview ? updatedReview : r
        ),
      }));
  
      Alert.alert("✅ Recenzie editată cu succes!");
      setModalVisible(false);
    } catch (error) {
      console.error("❌ Eroare la editarea recenziei: ", error);
      Alert.alert("Eroare! Încearcă din nou.");
    }
  };
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Se încarcă...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      {/* 🔹 Butonul de Favorite - Poziționat în dreapta sus */}
      {/* 🔹 Container pentru butonul de favorite */}
      <View style={{ position: "relative" }}>
        {/* 🔹 Butonul de Favorite - Poziționat în dreapta sus peste imagine */}
        <TouchableOpacity 
          onPress={toggleFavorite} 
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: 20,
            padding: 8,
            zIndex: 10, // 🔹 Asigură că este deasupra imaginii
          }}
        >
          <Text style={{ fontSize: 24, color: "white" }}>{isFavorite ? "⭐" : "☆"}</Text>
        </TouchableOpacity>

        {/* 🔹 Imaginea locației */}
        <Image source={{ uri: locationData?.imageUrl }} style={{ width: "100%", height: 200, borderRadius: 10 }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", flex: 1 }}>{locationData.name}</Text>
        <Button 
          title="Meniu 📜" 
          onPress={() => {
            if (locationData.menuUrl) {
              navigation.navigate("MenuScreen", { menuUrl: locationData.menuUrl });
            } else {
              Alert.alert("Meniul nu este disponibil pentru această locație.");
            }
          }}
        />
      </View>
      <Text>⭐ {locationData.rating}</Text>
      <Text>{locationData.description}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
        <Text>📍 {locationData.address}, {locationData.town} </Text>
        <TouchableOpacity 
          onPress={openInMaps} 
          style={{ backgroundColor: "#007bff", padding: 5, borderRadius: 5, marginLeft: 8 }}
        >
          <Text style={{ color: "white", fontSize: 14 }}> 🗺️ Harta</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontWeight: "bold", marginTop: 10 }}>⏰ Program:</Text>
{(() => {
  const weekDaysOrder = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];
  const sortedOpeningHours = weekDaysOrder.map(day => ({
    day,
    hours: location.openingHours[day] || "Inchis"
  }));

  return sortedOpeningHours.map(({ day, hours }) => (
    <Text key={day}>{day}: {hours}</Text>
  ));
})()}
      <Text style={{ fontWeight: "bold", marginTop: 10 }}>📢 Recenzii:</Text>
      {locationData.reviews?.length > 0 ? (
        locationData.reviews.map((review, index) => (
          <TouchableOpacity
  key={index}
  style={{ marginBottom: 10, padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}
  onLongPress={() => {
    if (review.userId === auth.currentUser?.uid) {
      Alert.alert(
        "Opțiuni recenzie",
        "Ce vrei să faci?",
        [
          { text: "Anulează", style: "cancel" },
          { text: "Editează", onPress: () => handleEditReview(review) },
          { text: "Șterge", onPress: () => handleDeleteReview(review), style: "destructive" },
        ]
      );
    } else {
      Alert.alert("⛔ Nu poți modifica această recenzie", "Doar autorul recenziei o poate edita sau șterge.");
    }
  }}
>
            <Text>👤 {review.user} - {review.rating} ⭐</Text>
            <Text>{review.comment}</Text>
            {review.timestamp && (
              <Text style={{ fontSize: 12, color: "gray" }}>
                ⏳ {timeAgo(review.timestamp.seconds)}
              </Text>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <Text>Fără recenzii momentan.</Text>
      )}
    <Modal visible={modalVisible} transparent animationType="slide">
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
    <View style={{ backgroundColor: "white", padding: 25, borderRadius: 10, width: 350 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Editează recenzia</Text>
      
      {/* Câmp Rating */}
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>Rating: ⭐</Text>
      <TextInput 
        placeholder="Rating (1-5)"
        keyboardType="numeric"
        value={newRating}
        onChangeText={setNewRating}
        style={{ borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15, fontSize: 16 }}
      />
      
      {/* Câmp Comentariu */}
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 5 }}>Comentariu text:</Text>
      <TextInput 
        placeholder="Modifică recenzia..."
        value={newComment}
        onChangeText={setNewComment}
        multiline
        numberOfLines={4}
        style={{ borderWidth: 1, borderRadius: 5, padding: 10, fontSize: 16, textAlignVertical: "top", minHeight: 80 }}
      />

      {/* Butoane */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
        <Button title="Anulează" onPress={() => setModalVisible(false)} />
        <Button title="Salvează" onPress={saveEditedReview} />
      </View>
    </View>
  </View>
</Modal>
      <Button 
        title="Adaugă Recenzie" 
        onPress={() => navigation.navigate("ReviewScreen", { locationId: location.id })} 
      />
    </ScrollView>
  );
};

export default LocationDetailsScreen;
