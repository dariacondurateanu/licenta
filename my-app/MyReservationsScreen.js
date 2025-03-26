import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";

const MyReservationsScreen = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("curente");
  const navigation = useNavigation();

  const fetchReservations = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const locatiiSnap = await getDocs(collection(db, "locations"));
      const allLocations = locatiiSnap.docs;

      const rezervariPromises = allLocations.map(async (locDoc) => {
        const locationId = locDoc.id;
        const locationData = locDoc.data();
        const locationName = locationData.name || locationData.nume || "Local";
        const rezervariSnap = await getDocs(
          query(
            collection(db, `locations/${locationId}/rezervari`),
            where("userId", "==", userId)
          )
        );

        const rezervari = await Promise.all(
          rezervariSnap.docs.map(async (rez) => {
            const data = rez.data();

            const masaRef = doc(db, `locations/${locationId}/mese`, data.masaId);
            const masaSnap = await getDoc(masaRef);
            const masaData = masaSnap.exists() ? masaSnap.data() : {};

            return {
              id: rez.id,
              locationId,
              address: locationData.address || "Adresă indisponibilă",
              numeRestaurant: locationName,
              localizare: masaData.localizare || "Necunoscut",
              data: data.data,
              oraStart: data.oraStart,
              oraEnd: data.oraEnd,
              ora: `${data.oraStart} - ${data.oraEnd}`,
              nrPersoane: data.nrPersoane,
            };
          })
        );

        return rezervari;
      });

      const allRezervari = (await Promise.all(rezervariPromises)).flat();
      setReservations(allRezervari);
    } catch (error) {
      console.error("Eroare la preluarea rezervărilor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId, restaurantName) => {
    try {
      const confirm = await new Promise((resolve) => {
        Alert.alert(
          "Confirmare anulare",
          `Sigur doriți să anulați rezervarea la ${restaurantName}?`,
          [
            { text: "Nu", style: "cancel", onPress: () => resolve(false) },
            { text: "Da", onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirm) return;

      const locatiiSnap = await getDocs(collection(db, "locations"));

      for (const locDoc of locatiiSnap.docs) {
        const rezervareRef = doc(db, `locations/${locDoc.id}/rezervari`, reservationId);
        const rezervareSnap = await getDoc(rezervareRef);

        if (rezervareSnap.exists()) {
          await deleteDoc(rezervareRef);
          fetchReservations(); // reload
          break;
        }
      }
    } catch (error) {
      console.error("Eroare la anularea rezervării:", error);
      Alert.alert("Eroare", "Nu s-a putut anula rezervarea.");
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const isPast = (rez) => {
    const endDateTime = moment(`${rez.data} ${rez.oraEnd}`, "YYYY-MM-DD HH:mm");
    return moment().isAfter(endDateTime);
  };

  const activeReservations = reservations.filter((rez) => !isPast(rez));
  const pastReservations = reservations.filter((rez) => isPast(rez));

  const renderItem = ({ item }) => {
    const isRezPast = isPast(item);
    const borderColor = isRezPast ? "#ccc" : "#4caf50";

    return (
      <TouchableOpacity
      onPress={() => {
        if (!item.locationId) {
          Alert.alert("Eroare", "ID-ul locației este lipsă.");
          return;
        }
      
        navigation.navigate("LocationDetails", {
          location: {
            id: item.locationId,
          },
        });
      }}
      
      
        activeOpacity={0.9}
      >
        <View style={[styles.cardWithBorder, { borderLeftColor: borderColor }]}>
          <View style={styles.card}>
            <Text style={styles.title}>{item.numeRestaurant}</Text>
            <Text style={styles.subTitle}>📍 {item.address}</Text>
            <Text style={{ marginBottom: 4 }}>🧭 Zonă: {item.localizare}</Text>
            <Text style={{ marginBottom: 4 }}>👥 Persoane: {item.nrPersoane}</Text>
            <Text style={{ marginBottom: 4 }}>📅 Data: {moment(item.data).format("DD MMMM YYYY")}</Text>
            <Text style={{ marginBottom: 4 }}>🕒 Ora: {item.ora}</Text>

            {!isRezPast && (
              <View style={styles.cancelWrapper}>
                <TouchableOpacity
                  style={styles.cancelCircle}
                  onPress={() => handleCancelReservation(item.id, item.numeRestaurant)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelIcon}>🗑</Text>
                </TouchableOpacity>
                <Text style={styles.cancelLabel}>Anulează</Text>
              </View>
            )}

            {isRezPast && (
              <View style={styles.cancelWrapper}>
                <TouchableOpacity
                  style={[styles.cancelCircle, { backgroundColor: "#007bff" }]}
                  onPress={() =>
                    navigation.navigate("ReviewScreen", {
                      locationId: item.locationId,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelIcon}>✍️</Text>
                </TouchableOpacity>
                <Text style={[styles.cancelLabel, { color: "#007bff" }]}>
                  Recenzie
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={styles.header}>📖 Rezervările mele</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setSelectedTab("curente")}
          style={[
            styles.tabButton,
            selectedTab === "curente" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "curente" && styles.activeTabText,
            ]}
          >
            Curente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("trecute")}
          style={[
            styles.tabButton,
            selectedTab === "trecute" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "trecute" && styles.activeTabText,
            ]}
          >
            Trecute
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Message */}
      <View style={{ marginBottom: 10 }}>
        {selectedTab === "curente" ? (
          <Text style={styles.infoText}>
            📌 Vă rugăm să ajungeți cu cel puțin 10 minute înainte de ora rezervării pentru a asigura disponibilitatea mesei.
          </Text>
        ) : (
          <Text style={styles.infoText}>
            🙏 Sperăm că vizita dumneavoastră a fost pe măsura așteptărilor. Vă așteptăm cu drag și cu alte ocazii!
          </Text>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={selectedTab === "curente" ? activeReservations : pastReservations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={{ marginTop: 30, fontSize: 16 }}>
              Nu există rezervări {selectedTab === "curente" ? "curente" : "trecute"}.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTab: {
    backgroundColor: "#fff",
  },
  activeTabText: {
    fontWeight: "bold",
    color: "#000",
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff7e6",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffcc00",
    marginBottom: 10,
  },
  cardWithBorder: {
    borderLeftWidth: 5,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "white",
    elevation: 2,
  },
  cancelWrapper: {
    alignItems: "center",
    position: "absolute",
    bottom: 12,
    right: 12,
  },
  cancelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  cancelIcon: {
    fontSize: 20,
    color: "white",
  },
  cancelLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#e63946",
    fontWeight: "500",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
});

export default MyReservationsScreen;
