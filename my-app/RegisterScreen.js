import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { auth,db } from "./firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Eroare", "Completează toate câmpurile!");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await updateProfile(user, { displayName: name });
  
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        favorites: [],
      });
  
      // ✅ Trimite email de confirmare

      await sendEmailVerification(user);
      await auth.signOut(); // ⬅️ ieșim din cont pentru a preveni blocaje

      navigation.navigate("EmailVerificationScreen");

  
      Alert.alert(
        "Verificare necesară",
        "Ți-am trimis un email pentru confirmare. Te rugăm să-l verifici înainte de autentificare.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("EmailVerificationScreen", { user }), // trimitem user
          },
        ]
      );
      
    } catch (error) {
      Alert.alert("Eroare", error.message);
      console.error("Eroare la înregistrare:", error);
    }
  };

  return (
    <View style={{ padding: 20, justifyContent: "center", alignItems: "center", flex: 1, backgroundColor: "#f8f9fa" }}>
      
      
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Înregistrare</Text>

      <TextInput
        placeholder="Nume"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 15, width: "100%", backgroundColor: "#fff" }}
      />

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
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20, width: "100%", backgroundColor: "#fff" }}
      />
        <TextInput
          autoComplete="off"
        textContentType="none"/>

      <Button title="Creează cont" onPress={handleRegister} color="#007bff" />
      
      <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 15 }}>
        <Text style={{ color: "#007bff" }}>Ai deja un cont? Autentifică-te</Text>
      </TouchableOpacity>
    </View>
  );
}
