import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";

const EmailVerificationScreen = ({ navigation, route }) => {
  const [checking, setChecking] = useState(false);
  const user = route.params?.user;

  const handleCheckVerification = async () => {
    if (!user) {
      Alert.alert("Sesiune lipsă", "Te rugăm să te autentifici din nou.");
      navigation.navigate("Login");
      return;
    }

    setChecking(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        Alert.alert("✅ Verificat", "Emailul tău a fost confirmat!");
        navigation.navigate("Login");
      } else {
        Alert.alert("⏳ Nu e verificat încă", "Verifică mailul și încearcă din nou.");
      }
    } catch (error) {
      Alert.alert("Eroare", error.message);
    }
    setChecking(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={{ fontSize: 20, textAlign: "center", marginBottom: 20 }}>
        📧 Ți-am trimis un email pentru verificare.
      </Text>
      <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 30 }}>
        După ce confirmi, apasă pe butonul de mai jos pentru a continua.
      </Text>

      <TouchableOpacity
        onPress={handleCheckVerification}
        disabled={checking}
        style={{
          backgroundColor: checking ? "#ccc" : "#28a745",
          paddingVertical: 12,
          paddingHorizontal: 25,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          {checking ? "Verificăm..." : "✅ Am verificat"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EmailVerificationScreen;
