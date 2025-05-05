import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Animated,
  ScrollView,
} from "react-native";
import { addReview } from "./reviewService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

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
<LinearGradient
  colors={["#f7f2ff", "#fefcff", "#ffffff"]}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={{ flex: 1 }}
>
  <ScrollView
    contentContainerStyle={{
      padding: 20,
      paddingBottom: 50, // să evităm coliziunea cu bara de jos
      flexGrow: 1,       // 🔥 face gradientul să acopere tot ecranul
      justifyContent: "center", // centrează conținutul când e puțin
    }}
  >
    <Text
      style={{
        fontSize: 26,
        fontWeight: "bold",
        color: "#2e2e60",
        marginBottom: 30,
        alignSelf: "center",
      }}
    >
      Lasă o recenzie
    </Text>

    {/* Nume utilizator */}
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Icon name="person" size={22} color="#888" style={{ marginRight: 10 }} />
      <TextInput
        placeholder="Numele tău"
        value={userName}
        onChangeText={setUserName}
        style={{ flex: 1, fontSize: 16, color: "#333" }}
        placeholderTextColor="#aaa"
      />
    </View>

    {/* Rating */}
    <Text style={{ fontSize: 16, color: "#2e2e60", marginBottom: 10, fontWeight: "bold" }}>
      Rating:
    </Text>
    <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 30 }}>
      {renderStars()}
    </View>

    {/* Comentariu */}
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <TextInput
        placeholder="Scrie o recenzie"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={5}
        style={{
          minHeight: 120,
          textAlignVertical: "top",
          fontSize: 16,
          color: "#333",
        }}
        placeholderTextColor="#aaa"
      />
    </View>

    {/* Buton */}
    <TouchableOpacity
      onPress={handleSubmitReview}
      style={{
        backgroundColor: "#d8c8f7",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Text style={{ color: "#2e2e60", fontSize: 18, fontWeight: "bold" }}>
        ✍️ Trimite Recenzie
      </Text>
    </TouchableOpacity>
  </ScrollView>
</LinearGradient>


  );
};

export default ReviewScreen;
