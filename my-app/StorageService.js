import { storage, firestore, database, getDownloadURL, ref, doc, updateDoc, dbRef, set } from "./firebaseConfig";

const saveMenuUrl = async (fileName, locationId) => {
  try {
    console.log("📂 Încep obținerea URL-ului pentru:", fileName);

    // Referință către fișier în Firebase Storage
    const fileRef = ref(storage, "licenta-app-518fb.firebasestorage.app/pdf/MeniuPplusunu.pdf");

    
    // Obține URL-ul de descărcare
    const url = await getDownloadURL(fileRef);
    console.log("🔗 URL obținut:", url);

    // 🔹 Salvare în Firestore
    const locationRef = doc(firestore, "locations", locationId);
    await updateDoc(locationRef, { menuUrl: url });
    console.log("✅ URL adăugat în Firestore!");

    // 🔹 Salvare în Realtime Database
    const dbPath = `menus/${locationId}`;
    await set(dbRef(database, dbPath), { menuUrl: url });
    console.log("✅ URL adăugat în Realtime Database la:", dbPath);

  } catch (error) {
    console.error("❌ Eroare la obținerea link-ului:", error);
  }
};

// ✅ Rulează această funcție pentru a testa
saveMenuUrl("MeniuNegroni.pdf", "kQz0umY47W9M4uN4SYQW");