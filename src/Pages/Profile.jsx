//Displays the profile of the logged-in user.
//Fetches and shows user's personal info, teams created, teams joined, join requests sent, and incoming join requests.
import React, { useState, useEffect } from "react";
import EditProfile from "../components/EditProfile";
import JoinRequestsManager from "../components/JoinRequestsManager";
import "./Profile.css";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();

export default function Profile() {
  console.log("Profile component render");
  const auth = getAuth();
  const user = auth.currentUser;


  const [profile, setProfile] = useState(null);
  const [teamsCreated, setTeamsCreated] = useState([]);
  const [teamsJoined, setTeamsJoined] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
     console.log("Profile useEffect run");
    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        } else {
          setError("User profile document not found.");
        }
      } catch {
        setError("Failed to fetch user profile.");
      }
    };

    const fetchTeamsCreated = async () => {
      try {
        const q = query(collection(db, "teams"), where("createdBy.uid", "==", user.uid));
        const snapshot = await getDocs(q);
        setTeamsCreated(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    };

    const fetchTeamsJoined = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;
        const data = userDoc.data();
        if (!data.teamsJoined) return;
        const teamIds = data.teamsJoined.map(t => t.uid);
        const teams = [];
        for (const id of teamIds) {
          const teamDoc = await getDoc(doc(db, "teams", id));
          if (teamDoc.exists()) teams.push({ id, ...teamDoc.data() });
        }
        setTeamsJoined(teams);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchJoinRequests = async () => {
      try {
        const q = query(collection(db, "joinRequests"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const requestsData = await Promise.all(snapshot.docs.map(async docSnap => {
          const reqData = docSnap.data();
          const teamSnap = await getDoc(doc(db, "teams", reqData.teamId));
          const teamName = teamSnap.exists() ? teamSnap.data().teamName : "Unknown Team";

          const hackathonId = teamSnap.exists() ? teamSnap.data().hackathonId : reqData.hackathonId;
          const hackathonSnap = await getDoc(doc(db, "hackathons", hackathonId));
          const hackathonTitle = hackathonSnap.exists() ? hackathonSnap.data().title : "Unknown Hackathon";

          return { ...reqData, id: docSnap.id, teamName, hackathonTitle };
        }));
        setJoinRequests(requestsData);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      await fetchUserProfile();
      await Promise.all([fetchTeamsCreated(), fetchTeamsJoined(), fetchJoinRequests()]);
      setLoading(false);
    };

    fetchAllData();
  }, [user]);

  if (loading) return <div className="loading-message">Loading profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="loading-message">User profile data not available.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-circle">{profile.name?.charAt(0).toUpperCase() || "U"}</div>
        <div className="profile-name">{profile.name || "User"}</div>
        <button className="edit-profile-btn" onClick={() => setEditing(true)}>Edit Profile</button>
      </div>

      <div className="profile-info">
        {profile.branch && <span>{profile.branch}</span>}
        {profile.batch && <span> | {profile.batch}</span>}
        {profile.college && <span> | {profile.college}</span>}
        {profile.skills?.length > 0 && <span> | {profile.skills.join(", ")}</span>}
      </div>

      {editing && <EditProfile profile={profile} onClose={() => setEditing(false)} onProfileUpdate={setProfile} />}

      <div className="profile-tabs">
        <div className="tab">
          <h3>Teams Created</h3>
          {teamsCreated.length === 0 && <p>No teams created yet.</p>}
          {teamsCreated.map(team => (
            <div key={team.id} className="team-card">
              <div><b>Team Name:</b> {team.teamName}</div>
              <div><b>Hackathon:</b> {team.hackathonId}</div>
              <div><b>Skills Required:</b> {team.skillsRequired?.join(", ") || "None"}</div>
              <div><b>Members:</b> {team.members?.map(m => m.name).join(", ") || "None"}</div>
            </div>
          ))}
        </div>

        <div className="tab">
          <h3>Teams Joined</h3>
          {teamsJoined.length === 0 && <p>No teams joined yet.</p>}
          {teamsJoined.map(team => (
            <div key={team.id} className="team-card">
              <div><b>Team Name:</b> {team.teamName}</div>
              <div><b>Hackathon:</b> {team.hackathonId}</div>
              <div><b>Skills Required:</b> {team.skillsRequired?.join(", ") || "None"}</div>
              <div><b>Members:</b> {team.members?.map(m => m.name).join(", ") || "None"}</div>
            </div>
          ))}
        </div>

        <div className="tab">
          <h3>Join Requests Sent</h3>
          {joinRequests.length === 0 && <p>No join requests sent.</p>}
          {joinRequests.map(req => (
            <div key={req.id} className="team-card">
              <div><b>Team Name:</b> {req.teamName}</div>
              <div><b>Hackathon:</b> {req.hackathonTitle}</div>
              <div><b>Status:</b> {req.status || "Pending"}</div>
            </div>
          ))}
        </div>

        <div className="tab">
          <h3>Incoming Join Requests</h3>
          <JoinRequestsManager userId={user.uid} />
        </div>
      </div>
    </div>
  );
}
