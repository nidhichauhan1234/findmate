import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "./TeamManage.css"; 

export default function ProfileById() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const userDoc = await getDoc(doc(db, "users", userId));
      setUser(userDoc.exists() ? userDoc.data() : null);
    }
    fetchUser();
  }, [userId]);

  if (!user)
    return (
      <div className="profile-container">
        <p className="error-text">User not found</p>
      </div>
    );

  return (
    <div className="profile-container">
      <h2 className="profile-name">{user.name}</h2>
      <div className="profile-details">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>College:</strong> {user.college}
        </p>
        <p>
          <strong>Batch:</strong> {user.batch}
        </p>
        <p>
          <strong>Branch:</strong> {user.branch}
        </p>
        <p>
          <strong>Skills:</strong> {user.skills?.join(", ")}
        </p>
      </div>
    </div>
  );
}
