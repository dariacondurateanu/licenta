import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { addReview } from "./reviewService";

const ReviewScreen = ({ route, navigation }) => {
  const { locationId } = route.params;
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmitReview = async () => {
    if (!userName || !rating || !comment) {
      Alert.alert("❗ Toate câmpurile sunt obligatorii!");
      return;
    }

    const numericRating = parseInt(rating);
    if (numericRating < 1 || numericRating > 5) {
      Alert.alert("❗ Ratingul trebuie să fie între 1 și 5 stele!");
      return;
    }

    try {
      await addReview(locationId, userName, numericRating, comment);
      Alert.alert("✅ Recenzie adăugată cu succes!");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Eroare la adăugare recenzie: ", error);
      Alert.alert("Eroare! Încearcă din nou.");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f8f9fa" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Lasă o recenzie</Text>
      
      <TextInput
        placeholder="Numele tău"
        value={userName}
        onChangeText={setUserName}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 15, width: "100%", backgroundColor: "#fff" }}
      />
      
      <TextInput
        placeholder="Rating (1-5)"
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 15, width: "100%", backgroundColor: "#fff" }}
      />
      
      <TextInput
        placeholder="Scrie o recenzie"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, textAlignVertical: "top", minHeight: 80, width: "100%", backgroundColor: "#fff" }}
      />
      
      <TouchableOpacity onPress={handleSubmitReview} style={{ backgroundColor: "#007bff", padding: 15, borderRadius: 10, width: "100%", alignItems: "center", marginTop: 10 }}>
        <Text style={{ color: "white", fontSize: 18 }}>Trimite Recenzie</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewScreen;
