import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { doc,getDoc, collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import moment from "moment";


const BookingScreen = ({ route, navigation }) => {
  const { locationId } = route.params;
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState("");
  const [availableHours, setAvailableHours] = useState([]);
  const [zona, setZona] = useState("inauntru");
  const [nrPersoane, setNrPersoane] = useState("2");

  useEffect(() => {
    fetchDisponibilitate();
  
    const interval = setInterval(() => {
      fetchDisponibilitate();
    }, 60000); // la fiecare 1 minut
  
    return () => clearInterval(interval);
  }, [date, zona]);
  
  

  const fetchDisponibilitate = async () => {
    console.log("🚀 fetchDisponibilitate() a început...");
  
    const selectedDate = moment(date).format("YYYY-MM-DD");
    const oraSlots = generateTimeSlots("11:00", "23:30", 10); 
    const results = [];
  
    console.log("📆 Data selectată:", selectedDate);
    console.log("📍 Zona selectată:", zona);
    console.log("📌 locationId:", locationId);
  
    const meseSnap = await getDocs(
      query(
        collection(db, `locations/${locationId}/mese`),
        where("localizare", "==", zona)
      )
    );
  
    const meseZona = meseSnap.docs.map(doc => doc.id);
    const meseZonaSet = new Set(meseZona);
  
    const rezervariSnap = await getDocs(
      query(
        collection(db, `locations/${locationId}/rezervari`),
        where("data", "==", selectedDate)
      )
    );
  
    const now = moment();
    const today = moment().format("YYYY-MM-DD");
  
    for (let ora of oraSlots) {
      const slotStart = moment(`${selectedDate} ${ora}`, "YYYY-MM-DD HH:mm");
      const slotEnd = moment(slotStart).add(89, "minutes");
  
      // ⛔ Dacă data e azi și ora e în trecut, ignorăm slotul
      if (selectedDate === today && slotStart.isBefore(now)) {
        console.log(`⏭️ Sar peste slotul ${ora} - e în trecut`);
        continue;
      }
  
      const meseRezervate = new Set();
  
      rezervariSnap.docs.forEach(doc => {
        const data = doc.data();
        const masaId = data.masaId;
  
        if (!meseZonaSet.has(masaId)) return;
  
        const rezervareStart = moment(`${selectedDate} ${data.oraStart}`, "YYYY-MM-DD HH:mm");
        const rezervareEnd = moment(`${selectedDate} ${data.oraEnd}`, "YYYY-MM-DD HH:mm");
  
        const seSuprapune =
          slotStart.isBefore(rezervareEnd) &&
          slotEnd.isAfter(rezervareStart);
  
        if (seSuprapune) {
          meseRezervate.add(masaId);
          console.log(`⛔ Masa ${masaId} ocupată între ${data.oraStart} și ${data.oraEnd}`);
        }
      });
  
      const meseLibere = meseZona.filter(masaId => !meseRezervate.has(masaId));
  
      results.push({
        ora,
        available: meseLibere.length > 0
      });
  
      console.log(`✅ ${meseLibere.length} mese libere la ${ora}`);
    }
  
    console.log("📊 Sloturi finale:", JSON.stringify(results, null, 2));
    setAvailableHours(results);
  };
  
  
  const generateTimeSlots = (start, end, stepMinutes) => {
    const startTime = moment(start, "HH:mm");
    const endTime = moment(end, "HH:mm");
    const times = [];

    while (startTime < endTime) {
      times.push(startTime.format("HH:mm"));
      startTime.add(stepMinutes, "minutes");
    }

    return times;
  };

  const handleSubmit = async () => {
    if (!name || !selectedHour || !nrPersoane) {
      Alert.alert("❗ Completează toate câmpurile!");
      return;
    }
  
    try {
      const selectedDate = moment(date).format("YYYY-MM-DD");
  
      // ⚠️ Ia numele localului din Firestore
      const docRef = doc(db, "locations", locationId);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        Alert.alert("Eroare", "Nu s-a găsit informația despre restaurant.");
        return;
      }
  
      const numeRestaurant = docSnap.data().nume || "Restaurant";
  
      const meseSnap = await getDocs(
        query(
          collection(db, `locations/${locationId}/mese`),
          where("localizare", "==", zona)
        )
      );
  
      const rezervariSnap = await getDocs(
        query(
          collection(db, `locations/${locationId}/rezervari`),
          where("data", "==", selectedDate),
          where("oraStart", "==", selectedHour)
        )
      );
  
      const meseRezervate = rezervariSnap.docs.map(d => d.data().masaId);
      const meseDisponibile = meseSnap.docs
        .filter(m => !meseRezervate.includes(m.id))
        .map(m => ({
          id: m.id,
          capacitate: m.data().capacitate
        }));
  
      const mesePotrivite = meseDisponibile
        .filter(m => m.capacitate >= parseInt(nrPersoane))
        .sort((a, b) => a.capacitate - b.capacitate);
  
      if (mesePotrivite.length === 0) {
        Alert.alert("❌ Nu există mese disponibile pentru numărul selectat de persoane.");
        return;
      }
  
      const masaLibera = mesePotrivite[0];
  
      await addDoc(collection(db, `locations/${locationId}/rezervari`), {
        userId: auth.currentUser?.uid,
        masaId: masaLibera.id,
        data: selectedDate,
        oraStart: selectedHour,
        oraEnd: moment(selectedHour, "HH:mm").add(89, "minutes").format("HH:mm"),
        nrPersoane: parseInt(nrPersoane),
        numeClient: name
      });
      

      Alert.alert("✅ Rezervare efectuată!");
      navigation.goBack();
    } catch (error) {
      console.error("Eroare la rezervare:", error);
      Alert.alert("❌ A apărut o eroare.");
    }
  };
  
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>📅 Rezervare nouă</Text>

        <Text style={{ marginBottom: 5 }}>👤 Numele tău:</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="ex: Ana Popescu"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 12,
            marginBottom: 15,
            backgroundColor: "white"
          }}
        />

        <Text style={{ marginBottom: 5 }}>👥 Număr persoane:</Text>
        <TextInput
          value={nrPersoane}
          onChangeText={setNrPersoane}
          placeholder="ex: 2"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 12,
            marginBottom: 15,
            backgroundColor: "white"
          }}
        />

        <Text style={{ marginBottom: 5 }}>📆 Alege data:</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={{
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#ccc",
            marginBottom: 15,
          }}
        >
          <Text>{moment(date).format("DD MMMM YYYY")}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (event.type !== "dismissed" && selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}

        <Text style={{ marginBottom: 5 }}>📍 Zonă:</Text>
        <View style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          marginBottom: 15,
          backgroundColor: "white",
        }}>
          <Picker selectedValue={zona} onValueChange={setZona}>
            <Picker.Item label="Înăuntru" value="inauntru" />
            <Picker.Item label="Terasa" value="terasa" />
          </Picker>
        </View>

        <Text style={{ marginBottom: 5 }}>🕒 Ora dorită:</Text>
        <View style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          marginBottom: 20,
          backgroundColor: "white",
        }}>
          <Picker
            selectedValue={selectedHour}
            onValueChange={setSelectedHour}
          >
            <Picker.Item label="Selectează ora..." value="" />
            {availableHours.map(({ ora, available }) => (
              <Picker.Item
                key={ora}
                label={`${ora}${available ? "" : " (ocupat)"}`}
                value={available ? ora : ""}
                color={available ? "black" : "gray"}
              />
            ))}
          </Picker>
        </View>

        <Button title="✅ Confirmă Rezervarea" onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BookingScreen;
