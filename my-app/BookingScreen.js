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
import { Ionicons } from "@expo/vector-icons";

const BookingScreen = ({ route, navigation }) => {
  const { locationId } = route.params;
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState("");
  const [availableHours, setAvailableHours] = useState([]);
  const [zona, setZona] = useState("inauntru");
  const [nrPersoane, setNrPersoane] = useState("2");
  const [localInchis, setLocalInchis] = useState(false);
  const [showInchisModal, setShowInchisModal] = useState(false);
  const [zoneOptions, setZoneOptions] = useState([]);
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
    const dayMap = {
      Sunday: "Duminica",
      Monday: "Luni",
      Tuesday: "Marti",
      Wednesday: "Miercuri",
      Thursday: "Joi",
      Friday: "Vineri",
      Saturday: "Sambata",
    };
    const ziSelectata = dayMap[moment(date).format("dddd")];
    console.log("📆 Zi selectată:", ziSelectata);
  
    const locationDoc = await getDoc(doc(db, "locations", locationId));
    const openingHours = locationDoc.data().openingHours;
    const oreZi = openingHours?.[ziSelectata];
    if (!oreZi || oreZi === "Inchis") {
      console.log("🚫 Localul este închis în această zi.");
      setLocalInchis(true);
      setShowInchisModal(true); // 👉 afișăm modalul
      setAvailableHours([]);
      return;
    }
    
    setLocalInchis(false);
    setShowInchisModal(false);
    
  
    const [oraStartStr, oraEndStr] = oreZi.replace("–", "-").split("-").map(t => t.trim());
    let oraEndAdjustata;
const endMoment = moment(oraEndStr.replace(".", ":"), "HH:mm");

if (endMoment.hours() < 5) {
  // Dacă ora de închidere e după miezul nopții (ex: 02:00), forțăm 23:30 ca limită
  oraEndAdjustata = "23:30";
} else {
  // Altfel, scădem 90 minute din ora normală de închidere
  const endTimeMoment = moment(oraEndStr.replace(".", ":"), "HH:mm").subtract(90, "minutes");
  oraEndAdjustata = endTimeMoment.format("HH:mm");
}

  
    const oraSlots = generateTimeSlots(oraStartStr, oraEndAdjustata, 10);
    const results = [];
  
    const meseTotaleSnap = await getDocs(collection(db, `locations/${locationId}/mese`));
const toateZonele = new Set(meseTotaleSnap.docs.map(doc => doc.data().localizare));
setZoneOptions([...toateZonele]);

if (!toateZonele.has(zona)) {
  const primaZona = [...toateZonele][0];
  setZona(primaZona); // 👉 schimbă automat zona dacă cea selectată nu există
  return; // Nu continuăm pentru a aștepta re-rularea efectului
}

const meseSnap = await getDocs(
  query(
    collection(db, `locations/${locationId}/mese`),
    where("localizare", "==", zona)
  )
);

const meseZona = meseSnap.docs.map(doc => doc.id);

if (meseZona.length === 0) {
  console.log("❌ Nu există mese pentru zona selectată.");
  setAvailableHours([]);
  return;
}
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
      const [h, m] = ora.split(":").map(Number);
      const slotStart = moment({ year: date.getFullYear(), month: date.getMonth(), day: date.getDate(), hour: h, minute: m });
      const slotEnd = moment(slotStart).add(89, "minutes");
  
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
  
        const seSuprapune = slotStart.isBefore(rezervareEnd) && slotEnd.isAfter(rezervareStart);
  
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
      navigation.navigate("MyReservationsScreen");
    } catch (error) {
      console.error("Eroare la rezervare:", error);
      Alert.alert("❌ A apărut o eroare.");
    }
  };
  
  return (
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : undefined}
  style={{ flex: 1, backgroundColor: "#ffffff" }}
>
  <ScrollView contentContainerStyle={{ padding: 24 }}>
    <Text
      style={{
        fontSize: 26,
        fontWeight: "600",
        color: "#2e2e60",
        marginBottom: 25,
        textAlign: "center",
      }}
    >
      📅 Rezervare nouă
    </Text>

    {/* Nume */}
    <Text style={labelStyle}>👤 Numele tău</Text>
    <TextInput
      value={name}
      onChangeText={setName}
      placeholder="ex: Ana Popescu"
      style={inputStyle}
      placeholderTextColor="#aaa"
    />

    {/* Nr persoane */}
    <Text style={labelStyle}>👥 Număr persoane</Text>
    <TextInput
      value={nrPersoane}
      onChangeText={setNrPersoane}
      placeholder="ex: 2"
      keyboardType="numeric"
      style={inputStyle}
      placeholderTextColor="#aaa"
    />

    {/* Data */}
    <Text style={labelStyle}>📆 Alege data</Text>
    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={inputStyle}>
      <Text style={{ color: "#2e2e60" }}>{moment(date).format("DD MMMM YYYY")}</Text>
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

    {/* Zona */}
    {!localInchis ? (
  <>
    {/* Zonă */}
    <Text style={labelStyle}>📍 Zonă</Text>
    <View style={inputStyle}>
      <Picker selectedValue={zona} onValueChange={setZona}>
      {zoneOptions.includes("inauntru") && (
  <Picker.Item label="Înăuntru" value="inauntru" />
)}
{zoneOptions.includes("terasa") && (
  <Picker.Item label="Terasa" value="terasa" />
)}
      </Picker>
    </View>

    {/* Ora */}
    <Text style={labelStyle}>🕒 Ora dorită</Text>
    <View style={inputStyle}>
      <Picker selectedValue={selectedHour} onValueChange={setSelectedHour}>
        <Picker.Item label="Selectează ora..." value="" />
        {availableHours.map(({ ora, available }) => (
          <Picker.Item
            key={ora}
            label={`${ora}${available ? "" : " (ocupat)"}`}
            value={available ? ora : ""}
            color={available ? "#2e2e60" : "gray"}
          />
        ))}
      </Picker>
    </View>
  </>
) : null
}



    {/* Confirmare */}
    {!localInchis && (
  <TouchableOpacity
    onPress={handleSubmit}
    style={{
      backgroundColor: "#b497f0",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 20,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    }}
  >
    <Text style={{ color: "#2e2e60", fontSize: 17, fontWeight: "bold" }}>
      ✅ Confirmă Rezervarea
    </Text>
  </TouchableOpacity>
)}

  </ScrollView>
  {showInchisModal && (
  <View
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      zIndex: 10,
    }}
  >
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: 25,
        width: "100%",
        maxWidth: 320,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 5,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#c02e50",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        🛑 Localul este închis în această zi.
      </Text>
      <Text style={{ textAlign: "center", color: "#333", marginBottom: 20 }}>
        Te rugăm să mergi la pagina localului pentru a verifica disponibilitatea.
      </Text>
      <TouchableOpacity
  onPress={() => navigation.goBack()}
  style={{
    backgroundColor: "#2e2e60",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  }}
>
  <Ionicons name="arrow-back" size={20} color="white" style={{ marginRight: 6 }} />
  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Înapoi</Text>
</TouchableOpacity>
    </View>
  </View>
)}

</KeyboardAvoidingView>

  );
};
const inputStyle = {
  backgroundColor: "#ffffff",
  borderWidth: 1.4,
  borderColor: "#2e2e60",
  borderRadius: 10,
  padding: 14,
  marginBottom: 18,
  fontSize: 16,
  color: "#2e2e60",
};
const labelStyle = {
  marginBottom: 6,
  color: "#2e2e60",
  fontSize: 16,
  fontWeight: "500",
};


export default BookingScreen;
