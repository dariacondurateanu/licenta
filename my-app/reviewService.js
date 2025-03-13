import { db ,auth} from "./firebaseConfig";
import { doc, updateDoc, arrayUnion, getDoc, Timestamp } from "firebase/firestore";

const addReview = async (locationId, userName, rating, comment) => {
  try {
    const locationRef = doc(db, "locations", locationId);
    const locationSnap = await getDoc(locationRef);

    if (!locationSnap.exists()) {
      console.error("Locația nu există!");
      return;
    }

    const newReview = {
      user: userName,
      userId: auth.currentUser.uid, 
      rating: rating,
      comment: comment,
      timestamp: Timestamp.now()
    };

    await updateDoc(locationRef, {
      reviews: arrayUnion(newReview),
    });

    console.log("✅ Recenzie adăugată cu succes!");
  } catch (error) {
    console.error("❌ Eroare la adăugare recenzie: ", error);
  }
};

export { addReview };
