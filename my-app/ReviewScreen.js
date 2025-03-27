import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Animated,
} from "react-native";
import { addReview } from "./reviewService";
import Icon from "react-native-vector-icons/MaterialIcons";

const ReviewScreen = ({ route, navigation }) => {
  const { locationId } = route.params;
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const scaleAnim = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

  const handleStarPress = (index) => {
    Animated.sequence([
      Animated.timing(scaleAnim[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setRating(index + 1);
  };

  const handleSubmitReview = async () => {
    if (!userName || !rating || !comment) {
      Alert.alert("❗ Toate câmpurile sunt obligatorii!");
      return;
    }

    try {
      await addReview(locationId, userName, rating, comment);
      Alert.alert("✅ Recenzie adăugată cu succes!");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Eroare la adăugare recenzie: ", error);
      Alert.alert("Eroare! Încearcă din nou.");
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const isSelected = i < rating;
      return (
        <TouchableOpacity key={i} onPress={() => handleStarPress(i)} activeOpacity={0.8}>
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim[i] }],
              marginHorizontal: 8,
            }}
          >
            <Icon
              name={isSelected ? "star" : "star-border"}
              size={40}
              color={isSelected ? "#f5c518" : "#ccc"}
            />
          </Animated.View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f0f2f5", padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 20, alignSelf: "center" }}>
        Lasă o recenzie
      </Text>

      {/* Nume utilizator */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 15
      }}>
        <Icon name="person" size={22} color="#888" style={{ marginRight: 10 }} />
        <TextInput
          placeholder="Numele tău"
          value={userName}
          onChangeText={setUserName}
          style={{ flex: 1, fontSize: 16 }}
        />
      </View>

      {/* Rating */}
      <Text style={{ fontSize: 16, color: "#555", marginBottom: 8 }}>Rating:</Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 15,
          marginBottom: 25,
          //backgroundColor: "#fff",
          borderRadius: 16,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        {renderStars()}
      </View>

      {/* Comentariu */}
      <View style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 20
      }}>
        <TextInput
          placeholder="Scrie o recenzie"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: "top", fontSize: 16 }}
        />
      </View>

      {/* Buton */}
      <TouchableOpacity
        onPress={handleSubmitReview}
        style={{
          backgroundColor: "#4a90e2",
          paddingVertical: 15,
          borderRadius: 12,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Trimite Recenzie</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewScreen;
