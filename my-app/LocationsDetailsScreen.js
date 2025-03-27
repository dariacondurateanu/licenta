import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Button, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from "react-native";

import { useNavigation, useIsFocused } from "@react-navigation/native";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { db , auth} from "./firebaseConfig"; 
import { Linking } from "react-native";
import { recalculateRating } from "./reviewService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Animated } from "react-native";

const LocationsDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const location = route.params?.location;
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRating, setNewRating] = useState("");
  const [newComment, setNewComment] = useState(""); 
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const [showReviews, setShowReviews] = useState(false);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  const pulseHeart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };
  useEffect(() => {
    const fetchLocation = async () => {
      if (!route?.params?.location?.id) {
        console.warn("Lipsă parametru location!");
        return;
      }
  
      setLoading(true);
      const locationRef = doc(db, "locations", route.params.location.id);
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
        //Alert.alert("❌ Eliminat din favorite!");
        } else {
          await updateDoc(userRef, {
            favorites: arrayUnion(location.id),
          });
          setIsFavorite(true);
          pulseHeart(); // ❤️ pulsăm doar la adăugare
          //Alert.alert("❤️ Adăugat la favorite!");
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

  const handleDeleteReview = async (reviewToDelete) => {
    Alert.alert(
      "Confirmare",
      "Sigur vrei să ștergi această recenzie?",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            try {
              const locationRef = doc(db, "locations", location.id);
              const locationSnap = await getDoc(locationRef);
  
              if (!locationSnap.exists()) return;
  
              const currentReviews = locationSnap.data().reviews || [];
  
              // Eliminăm recenzia pe baza userId + timestamp
              const updatedReviews = currentReviews.filter(
                (r) =>
                  r.userId !== reviewToDelete.userId ||
                  r.timestamp.seconds !== reviewToDelete.timestamp.seconds
              );
  
              await updateDoc(locationRef, {
                reviews: updatedReviews,
              });
  
              // Recalculăm ratingul
              await recalculateRating(location.id, updatedReviews);
  
              // Update UI
              setLocationData((prev) => ({
                ...prev,
                reviews: updatedReviews,
                rating:
                  updatedReviews.length > 0
                    ? parseFloat(
                        (
                          updatedReviews.reduce((acc, r) => acc + r.rating, 0) /
                          updatedReviews.length
                        ).toFixed(1)
                      )
                    : 0,
              }));
  
              Alert.alert("✅ Recenzie ștearsă!");
            } catch (error) {
              console.error("❌ Eroare la ștergerea recenziei: ", error);
              Alert.alert("Eroare! Încearcă din nou.");
            }
          },
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
    const snap = await getDoc(locationRef);
    const data = snap.data();
    const reviews = data.reviews || [];

    const updatedReview = {
      ...editingReview,
      rating: numericRating,
      comment: newComment,
      timestamp: editingReview.timestamp,
    };

    // 🧹 Înlocuiește în array după userId și timestamp
    const updatedReviews = reviews.map((r) =>
      r.userId === editingReview.userId &&
      r.timestamp?.seconds === editingReview.timestamp?.seconds
        ? updatedReview
        : r
    );

    // 📤 Update complet în Firestore
    await updateDoc(locationRef, {
      reviews: updatedReviews,
    });

    // 🔁 Recalculăm ratingul
await recalculateRating(location.id, updatedReviews);

    // 🔄 Obținem ratingul actualizat din Firestore
    const updatedSnap = await getDoc(locationRef);
    const updatedData = updatedSnap.data();

    // 🟢 Update UI local complet
    setLocationData({
      ...updatedData
    });

    setModalVisible(false);
    Alert.alert("✅ Recenzie editată cu succes!");
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
    <SafeAreaView style={{ flex: 1 }}>
  <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 40 }}>
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
         <Animated.Text
  style={{
    fontSize: 28,
    transform: [{ scale: scaleAnim }],
    color: isFavorite ? "red" : "white",
  }}
>
  {isFavorite ? "❤️" : "♡"}
</Animated.Text>


        </TouchableOpacity>

        {/* 🔹 Imaginea locației */}
        <ScrollView 
  horizontal 
  pagingEnabled 
  showsHorizontalScrollIndicator={false}
  style={{ width: "100%", height: 200, borderRadius: 10 }}
>
  {locationData?.imageUrls?.map((imgUrl, index) => (
    <Image 
      key={index} 
      source={{ uri: imgUrl }} 
      style={{ width: 350, height: 200, borderRadius: 10, marginRight: 10 }} 
      resizeMode="cover"
    />
  ))}
</ScrollView>

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
      <TouchableOpacity
  onPress={() => setReviewsModalVisible(true)}
  style={{ marginTop: 8, marginBottom: 4, alignSelf: "flex-start" }}
>
  <Text style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>
    {locationData.rating && locationData.rating > 0
      ? `⭐ ${locationData.rating}`
      : "⭐ Fără rating momentan"} - Vezi recenzii
  </Text>
</TouchableOpacity>


      <Text>{locationData.description}</Text>
      <TouchableOpacity onPress={openInMaps} style={{ marginTop: 5 }}>
  <Text style={{ fontSize: 16 }}>
    📍 <Text style={{ color: "#007bff", textDecorationLine: "underline" }}>
      {locationData.address}, {locationData.town}
    </Text>
  </Text>
</TouchableOpacity>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>⏰ Program:</Text>
{(() => {
  const weekDaysOrder = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];
  const sortedOpeningHours = weekDaysOrder.map(day => ({
    day,
    hours: locationData?.openingHours[day] || "Inchis"
  }));

  return sortedOpeningHours.map(({ day, hours }) => (
    <Text key={day}>{day}: {hours}</Text>
  ));
})()}

{/* 🎯 Activități disponibile */}
{Array.isArray(locationData.activities) && locationData.activities.length > 0 && (
  <View style={{ marginTop: 20 }}>
    <Text style={{ fontWeight: "bold" }}>🎯 Activități disponibile:</Text>
    <View style={{ marginTop: 5 }}>
      {locationData.activities.map((act, index) => (
        <Text key={index}>• {act}</Text>
      ))}
    </View>
  </View>
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
<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
  {/* Buton Adaugă Recenzie */}
  <TouchableOpacity
    style={{
      backgroundColor: "#007bff",
      padding: 12,
      borderRadius: 8,
      flex: 1,
      marginRight: 5,
    }}
    onPress={() => navigation.navigate("ReviewScreen", { locationId: location.id })}
  >
    <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
      ✍️ Adauga Recenzie
    </Text>
  </TouchableOpacity>

  {/* Buton Rezervă */}
  <TouchableOpacity
    disabled={!locationData?.permiteRezervare}
    style={{
      backgroundColor: locationData?.permiteRezervare ? "#28a745" : "#ccc",
      padding: 12,
      borderRadius: 8,
      flex: 1,
    }}
    onPress={() => {
      if (locationData?.permiteRezervare) {
        navigation.navigate("BookingScreen", { locationId: location.id });
      }
    }}
  >
    <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
      📅 Rezervă
    </Text>
  </TouchableOpacity>
</View>

    </ScrollView>
    <Modal visible={reviewsModalVisible} animationType="slide" transparent={false}>
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        📢 Recenzii pentru {locationData.name}
      </Text>

      {locationData.reviews?.length > 0 ? (
        locationData.reviews.map((review, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: 15,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>👤 {review.user}</Text>
              <Text style={{ fontSize: 15, color: "#f5c518" }}>{review.rating} ⭐</Text>
            </View>
            <Text style={{ fontSize: 15, marginBottom: 6 }}>{review.comment}</Text>
            {review.timestamp && (
              <Text style={{ fontSize: 12, color: "gray", textAlign: "right" }}>
                ⏳ {timeAgo(review.timestamp.seconds)}
              </Text>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <Text>Fără recenzii momentan.</Text>
      )}

      <TouchableOpacity
        onPress={() => setReviewsModalVisible(false)}
        style={{
          marginTop: 30,
          backgroundColor: "#dc3545",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>✖ Închide</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
</Modal>

  </SafeAreaView>
  );
};

export default LocationsDetailsScreen;
