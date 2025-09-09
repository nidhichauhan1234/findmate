import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";

export default function ManageTeam() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [team, setTeam] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTeam() {
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (!teamDoc.exists()) {
          setError("Team not found.");
          setLoadingTeam(false);
          return;
        }
        const teamData = { id: teamDoc.id, ...teamDoc.data() };

        // Check if user is creator, else deny access
        if (teamData.createdBy.uid !== user.uid) {
          setError("You are not authorized to manage this team.");
          setLoadingTeam(false);
          return;
        }
        setTeam(teamData);
        setLoadingTeam(false);
      } catch {
        setError("Failed to fetch team data.");
        setLoadingTeam(false);
      }
    }
    fetchTeam();
  }, [teamId, user, navigate]);

  useEffect(() => {
    async function fetchJoinRequests() {
      if (!team) return;
      setLoadingRequests(true);
      try {
        const q = query(
          collection(db, "joinRequests"),
          where("teamId", "==", team.id),
          where("status", "==", "pending")
        );
        const snapshot = await getDocs(q);

        // Enrich requests with user profiles
        const requestsWithProfiles = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const req = { id: docSnap.id, ...docSnap.data() };
            const userDoc = await getDoc(doc(db, "users", req.userId));
            req.userProfile = userDoc.exists() ? userDoc.data() : null;
            return req;
          })
        );

        setJoinRequests(requestsWithProfiles);
      } catch {
        setJoinRequests([]);
      }
      setLoadingRequests(false);
    }
    fetchJoinRequests();
  }, [team]);

const acceptRequest = async (req) => {
  try {
    // Update request status
    await updateDoc(doc(db, "joinRequests", req.id), { status: "accepted" });

    // Get fresh team data
    const teamRef = doc(db, "teams", team.id);
    const teamDoc = await getDoc(teamRef);
    const currentTeamData = teamDoc.data();

    // Add user to team members if not present
    const isMember = currentTeamData.members.some((m) => m.uid === req.userId);
    if (!isMember) {
      const updatedMembers = [...currentTeamData.members, { 
        uid: req.userId, 
        name: req.userProfile?.name || "Unnamed", 
        skills: req.userProfile?.skills || [] 
      }];
      
      await updateDoc(teamRef, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
      });
    }

    // CRITICAL FIX: Get user data first, then update teamsJoined
    const userRef = doc(db, "users", req.userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTeamsJoined = userData.teamsJoined || [];
      
      // Check if team already exists
      const teamExists = currentTeamsJoined.some(t => t.uid === team.id);
      
      if (!teamExists) {
        // Use array spread instead of arrayUnion for better control
        await updateDoc(userRef, {
          teamsJoined: [...currentTeamsJoined, { uid: team.id }]
        });
        
        console.log(`Added team ${team.id} to user ${req.userId} teamsJoined`);
      }
    }

    // Update local state
    setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    
    // Refresh team data
    const updatedTeamDoc = await getDoc(teamRef);
    if (updatedTeamDoc.exists()) {
      setTeam({ id: updatedTeamDoc.id, ...updatedTeamDoc.data() });
    }

    alert(`Accepted join request from ${req.userProfile?.name || "User"}`);
  } catch (err) {
    console.error("Error accepting request:", err);
    alert("Error accepting request.");
  }
};


  const rejectRequest = async (req) => {
    try {
      await updateDoc(doc(db, "joinRequests", req.id), { status: "rejected" });
      setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
      alert(`Rejected join request from ${req.userProfile?.name || "User"}`);
    } catch (err) {
      console.error(err);
      alert("Error rejecting request.");
    }
  };

  const removeMember = async (memberUid) => {
    if (memberUid === user.uid) {
      alert("You cannot remove yourself from the team as creator.");
      return;
    }
    try {
      // Remove member from team
      const newMembers = team.members.filter((m) => m.uid !== memberUid);
      await updateDoc(doc(db, "teams", team.id), {
        members: newMembers,
        memberCount: newMembers.length,
      });

      // Remove team from user's teamsJoined
      const userRef = doc(db, "users", memberUid);
      await updateDoc(userRef, {
        teamsJoined: arrayRemove({ uid: team.id }),
      });

      setTeam((prev) => ({ ...prev, members: newMembers, memberCount: newMembers.length }));
      alert("Member removed.");
    } catch (err) {
      console.error(err);
      alert("Error removing member.");
    }
  };

  const deleteTeam = async () => {
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      // Consider deleting related join requests also if needed (optional)
      await deleteDoc(doc(db, "teams", team.id));
      alert("Team deleted successfully.");
      navigate("/myteams");
    } catch (err) {
      console.error(err);
      alert("Error deleting team.");
    }
  };

  if (loadingTeam) return <div>Loading team details...</div>;
  if (error) return <div style={{ color: "red", padding: "20px" }}>{error}</div>;
  if (!team) return null;

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "auto" }}>
      <h2>Manage Team: {team.teamName}</h2>
      <p><b>Hackathon:</b> {team.hackathonId}</p>
      <p><b>Members ({team.memberCount}):</b></p>
      <ul>
        {team.members.map((m) => (
          <li key={m.uid} style={{ marginBottom: 8 }}>
            {m.name}
            {m.uid !== user.uid && (
              <button style={{ marginLeft: 12 }} onClick={() => removeMember(m.uid)}>Remove</button>
            )}
            {m.uid === user.uid && <span style={{ marginLeft: 12, fontStyle: "italic" }}>(You)</span>}
          </li>
        ))}
      </ul>

      <section style={{ marginTop: 30 }}>
        <h3>Pending Join Requests</h3>
        {loadingRequests && <p>Loading requests...</p>}
        {!loadingRequests && joinRequests.length === 0 && <p>No pending join requests.</p>}

        {joinRequests.map((req) => (
          <div key={req.id} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 12, borderRadius: 8 }}>
            <p><b>{req.userProfile?.name || "Unknown User"}</b> wants to join</p>
            <p><i>"{req.message}"</i></p>
            <button onClick={() => acceptRequest(req)} style={{ marginRight: 12 }}>Accept</button>
            <button onClick={() => rejectRequest(req)}>Reject</button>
          </div>
        ))}
      </section>

      <section style={{ marginTop: 40 }}>
        <button style={{ backgroundColor: "red", color: "white", padding: "10px 14px", border: "none", borderRadius: "8px"}} onClick={deleteTeam}>Delete Team</button>

        <button style={{ marginLeft: 20, padding: "10px 14px" }} onClick={() => navigate(`/team/chat/${team.id}`)}>Go to Team Chat</button>
      </section>
    </div>
  );
}
