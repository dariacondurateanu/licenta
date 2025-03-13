import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth,db } from "./firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // 🔍 Verifică dacă userul are document în Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        // ✅ Dacă nu există, creează-l
        await setDoc(userRef, {
          name: user.displayName || "", // sau poți pune un nume temporar
          email: user.email,
          favorites: []
        });
        console.log("📁 Document utilizator creat în Firestore");
      }
  
      Alert.alert("Autentificare reușită!");
      navigation.navigate("LocationsList");
  
    } catch (error) {
      Alert.alert("Eroare la autentificare", error.message);
    }
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f8f9fa" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Autentificare</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 15, width: "100%", backgroundColor: "#fff" }}
      />

      <TextInput
        placeholder="Parolă"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 15, width: "100%", backgroundColor: "#fff" }}
      />

      {/* CheckBox personalizat */}
      <TouchableOpacity onPress={() => setKeepLoggedIn(!keepLoggedIn)} style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: "#007bff",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
          backgroundColor: keepLoggedIn ? "#007bff" : "transparent"
        }}>
          {keepLoggedIn && <Text style={{ color: "white", fontWeight: "bold" }}>✔</Text>}
        </View>
        <Text>Păstrează-mă conectat</Text>
      </TouchableOpacity>

      <Button title="Autentificare" onPress={handleLogin} color="#28a745" />

      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 15 }}>
        <Text style={{ color: "#007bff" }}>Nu ai cont? Înregistrează-te</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
