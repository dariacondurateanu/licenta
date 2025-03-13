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

    const data = locationSnap.data();

    // Asigură-te că există array-ul de recenzii
    if (!Array.isArray(data.reviews)) {
      await updateDoc(locationRef, { reviews: [] });
    }

    const newReview = {
      user: userName,
      userId: auth.currentUser.uid,
      rating,
      comment,
      timestamp: Timestamp.now(),
    };

    // Adaugă recenzia
    await updateDoc(locationRef, {
      reviews: arrayUnion(newReview),
    });

    // ⏳ Așteaptă noile date înainte de recalculare
    const updatedSnap = await getDoc(locationRef);
    const updatedData = updatedSnap.data();
    const updatedReviews = updatedData.reviews || [];

    // Recalculăm media
    await recalculateRating(locationId, updatedReviews);

    console.log("✅ Recenzie adăugată cu succes!");
  } catch (error) {
    console.error("❌ Eroare la adăugare recenzie: ", error);
    throw error;
  }
};



const recalculateRating = async (locationId, reviews = []) => {
  const locationRef = doc(db, "locations", locationId);

  if (!Array.isArray(reviews)) {
    const snap = await getDoc(locationRef);
    const data = snap.data();
    reviews = data.reviews || [];
  }

  if (reviews.length === 0) {
    await updateDoc(locationRef, { rating: 0 });
    return;
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const average = total / reviews.length;

  await updateDoc(locationRef, {
    rating: parseFloat(average.toFixed(1)),
  });
};


export { addReview,recalculateRating };
