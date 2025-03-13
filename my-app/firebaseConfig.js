import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


const firebaseConfig = {
    apiKey: "AIzaSyDnl0tdlC3Y71PqHLRL7Pd2b4HNv3eHO9k",
    authDomain: "licenta-app-518fb.firebaseapp.com",
    projectId: "licenta-app-518fb",
    storageBucket: "licenta-app-518fb.appspot.com",
    messagingSenderId: "299268706330",
    appId: "1:299268706330:web:93bbc0d00634b5ceb801a3"
  };
  


// Inițializează Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
export { db, auth };



