import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

const locations = [
  {
    name: "Negroni",
    description: "Cocktail bar elegant cu atmosferă relaxantă",
    openingHours: {
      Monday: "Closed",
      Tuesday: "17:00 - 02:00",
      Wednesday: "17:00 - 02:00",
      Thursday: "17:00 - 03:00",
      Friday: "17:00 - 04:00",
      Saturday: "17:00 - 04:00",
      Sunday: "17:00 - 02:00"
    },
    type: "cocktail bar",
    address: "5 Matei Millo Street",
    town: "Bucharest",
    rating: 4.8,
    reviews: [],
    imageUrl: "https://www.google.com/url?sa=i&url=https%3A%2F%2Frestograf.ro%2Fnegroni-aperitivo-bar-bucuresti-picteaza-orasul-in-rosu-si-seduce-cu-un-nou-tip-de-experienta%2F&psig=AOvVaw0S6UUcsz52uBkGiH55H6Z5&ust=1741176134575000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNCA1_Kw8IsDFQAAAAAdAAAAABAE"
  }
];

const addLocationsToFirestore = async () => {
  try {
    for (let loc of locations) {
      await addDoc(collection(db, "locations"), loc);
    }
    console.log("✅ Locațiile au fost adăugate cu succes în Firestore!");
  } catch (error) {
    console.error("❌ Eroare la adăugarea locațiilor:", error);
  }
};

// Rulează funcția
addLocationsToFirestore();
