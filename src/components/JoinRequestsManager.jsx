import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc
} from "firebase/firestore";
import "./home.css";

export default function JoinRequestsManager() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    async function fetchIncomingRequests() {
      setLoading(true);
      try {
        // Get teams created by current user
        const teamsRef = collection(db, "teams");
        const teamQuery = query(teamsRef, where("createdBy.uid", "==", user.uid));
        const teamSnap = await getDocs(teamQuery);
        const myTeamIds = teamSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }));

        // Get join requests for these teams
        let requests = [];
        for (const { id: teamId, data: teamData } of myTeamIds) {
          const requestsRef = collection(db, "joinRequests");
          const reqQuery = query(requestsRef, where("teamId", "==", teamId), where("status", "==", "pending"));
          const reqSnap = await getDocs(reqQuery);

          const reqsWithUserAndTeam = await Promise.all(reqSnap.docs.map(async reqDoc => {
            const req = reqDoc.data();
            // Fetch requester user profile
            const userDoc = await getDoc(doc(db, "users", req.userId));
            const userProfile = userDoc.exists() ? userDoc.data() : null;
            return {
              id: reqDoc.id,
              teamId,
              teamName: teamData.teamName,
              requesterName: userProfile ? userProfile.name : "Unknown User",
              message: req.message,
              status: req.status,
              userId: req.userId,
            };
          }));

          requests = [...requests, ...reqsWithUserAndTeam];
        }

        setIncomingRequests(requests);
      } catch (err) {
        console.error("Error fetching incoming requests: ", err);
      }
      setLoading(false);
    }

    fetchIncomingRequests();
  }, [user]);

const handleAccept = async (request) => {
  try {
    // Update request status to 'accepted'
    const reqRef = doc(db, "joinRequests", request.id);
    await updateDoc(reqRef, { status: "accepted" });

    // Get fresh team data
    const teamRef = doc(db, "teams", request.teamId);
    const teamDoc = await getDoc(teamRef);
    if (!teamDoc.exists()) {
      alert("Team does not exist.");
      return;
    }
    const teamData = teamDoc.data();

    // Add user to team's members array if not already member
    const alreadyMember = teamData.members.some(m => m.uid === request.userId);
    if (!alreadyMember) {
      const updatedMembers = [...teamData.members, { 
        uid: request.userId, 
        name: request.requesterName, 
        skills: [] 
      }];
      
      await updateDoc(teamRef, {
        members: updatedMembers,
        memberCount: updatedMembers.length,
      });
    }

    // CRITICAL FIX: Get user data first, then update teamsJoined
    const userRef = doc(db, "users", request.userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTeamsJoined = userData.teamsJoined || [];
      
      // Check if team already exists
      const teamExists = currentTeamsJoined.some(t => t.uid === request.teamId);
      
      if (!teamExists) {
        // Use array spread instead of arrayUnion for better control
        await updateDoc(userRef, {
          teamsJoined: [...currentTeamsJoined, { uid: request.teamId }]
        });
        
        console.log(`Added team ${request.teamId} to user ${request.userId} teamsJoined`);
      }
    }

    // Remove the accepted request from local state
    setIncomingRequests(prev => prev.filter(req => req.id !== request.id));

    alert(`Accepted request from ${request.requesterName}`);
  } catch (err) {
    console.error("Error accepting request: ", err);
    alert("Failed to accept request.");
  }
};


  const handleReject = async (request) => {
    try {
      // Update request status to 'rejected'
      const reqRef = doc(db, "joinRequests", request.id);
      await updateDoc(reqRef, { status: "rejected" });

      // Remove from local state
      setIncomingRequests(prev => prev.filter(req => req.id !== request.id));

      alert(`Rejected request from ${request.requesterName}`);
    } catch (err) {
      console.error("Error rejecting request: ", err);
      alert("Failed to reject request.");
    }
  };

  if (loading) return <div>Loading incoming join requests...</div>;

  return (
    <div>
      <h2>Incoming Join Requests</h2>
      {incomingRequests.length === 0 ? (
        <p>No pending join requests</p>
      ) : (
        incomingRequests.map(request => (
          <div key={request.id} className="join-request-card">
            <p><strong>Team:</strong> {request.teamName}</p>
            <p><strong>Requester:</strong> {request.requesterName}</p>
            <p><strong>Message:</strong> {request.message}</p>
            <p><strong>Status:</strong> {request.status}</p>
            <button onClick={() => handleAccept(request)}>Accept</button>
            <button onClick={() => handleReject(request)}>Reject</button>
          </div>
        ))
      )}
    </div>
  );
}
