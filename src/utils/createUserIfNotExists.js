// utils/createUserIfNotExists.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createUserIfNotExists = async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      college: "",
      branch: "",
      batch: "",
      profilePicture: "",
      teamsJoined: []
    });
  }
};
