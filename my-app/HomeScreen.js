import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 40 }}>Welcome to CityHub! 👋</Text>

      <TouchableOpacity
        style={{ backgroundColor: "#007bff", padding: 15, borderRadius: 10, width: "80%", alignItems: "center", marginBottom: 15 }}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={{ color: "white", fontSize: 18 }}>Înregistrează-te</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ backgroundColor: "#28a745", padding: 15, borderRadius: 10, width: "80%", alignItems: "center" }}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={{ color: "white", fontSize: 18 }}>Autentificare</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
