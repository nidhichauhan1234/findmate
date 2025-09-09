import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDq7_MRHswL7O6ytQI-pUfYTRRE00Y1d8U",
  authDomain: "findmate-6f2aa.firebaseapp.com",
  projectId: "findmate-6f2aa",
  storageBucket: "findmate-6f2aa.firebasestorage.app",
  messagingSenderId: "428245627783",
  appId: "1:428245627783:web:6fe6e4df4f6f5bbad65922"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);