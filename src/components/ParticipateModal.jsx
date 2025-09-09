//it shows a modal dialgo allowing the user to create a new team for a hacakthon or join a exisitng team 
//fetching all teams related to the hackahton and check if the user already created/joined/requested a team 

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

const fetchUserProfileByUid = async (uid) => {
  if (!uid) return null;
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch {
    return null;
  }
};//it fetches profile data from firesotre 

const ParticipateModal = ({ hackathon, closeModal }) => {//porps passed hackathon currently viewed 
  //closeModal - function to close the modal 
  const [view, setView] = useState("");//Trakcs modal screen for create and join
  const [teamName, setTeamName] = useState("");//input for creating a team
  const [skills, setSkills] = useState("");//input for creating a team 
  const [teams, setTeams] = useState([]);//all teams fetched related to hackathon 
  const [joinMessage, setJoinMessage] = useState("");//for joining a team
  const [selectedTeamId, setSelectedTeamId] = useState(null);//for joing a tema
  const [alreadyCreated, setAlreadyCreated] = useState(false);//flags to check if user already created or joined  at team
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;
//When modal mounts or hackathon changes:
// Fetches all teams linked to this hackathon.
// For each team, fetches the creator's and members' profiles.
// Sets teams state with enriched data.
// Determines if user already created or joined any team here.
// Checks if user already has a pending join request.
// Updates loading state accordingly.
  // Fetch all relevant teams for the hackathon and user participation info
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      const teamsRef = collection(db, "teams");
      const q = query(teamsRef, where("hackathonId", "==", hackathon.id));
      const snapshot = await getDocs(q);
    
      //Map teams to include creator and member profiles
     const teamsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const team = { id: docSnap.id, ...data };
          team.creatorProfile = data.createdBy?.uid
            ? await fetchUserProfileByUid(data.createdBy.uid)
            : null;
          team.memberProfiles = await Promise.all(
            (data.members || []).map((m) =>
              m.uid ? fetchUserProfileByUid(m.uid) : null
            )
          );
          return team;
        })
      );
      setTeams(teamsData);

      // Check if user already created a team in this hackathon
      setAlreadyCreated(
        teamsData.some((team) => team.createdBy?.uid === user.uid)
      );

      // Check if user is member of any team in this hackathon
      setAlreadyJoined(
        teamsData.some((team) =>
          (team.members || []).some((member) => member.uid === user.uid)
        )
      );

      // Check if user has pending join request in this hackathon
      const requestsRef = collection(db, "joinRequests");
      const reqQuery = query(
        requestsRef,
        where("hackathonId", "==", hackathon.id),
        where("userId", "==", user.uid),
        where("status", "==", "pending")
      );
      const reqSnapshot = await getDocs(reqQuery);
      setAlreadyRequested(!reqSnapshot.empty);

      setLoading(false);
    };

    fetchData();
  }, [hackathon.id, user]);

/*Validates inputs are filled
Ensures user is not already part of a team or has a pending request.
Creates a new team with provided info and adds the current user as first member and creator.
Resets form and closes modal on success. */
  const handleCreateTeam = async () => {
    if (!teamName.trim() || !skills.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    if (alreadyCreated || alreadyJoined || alreadyRequested) {
      alert(
        "You cannot create or join more than one team for the same hackathon."
      );
      return;
    }
    if (!user) {
      alert("User is not authenticated.");
      return;
    }
    try {//Add new team document in firestore
      await addDoc(collection(db, "teams"), {
        hackathonId: hackathon.id,
        teamName: teamName.trim(),
        skillsRequired: skills.split(",").map((s) => s.trim()),
        members: [{ uid: user.uid, name: user.displayName || "Anonymous", skills: [] }],
        createdBy: { uid: user.uid, name: user.displayName || "Anonymous", email: user.email },
        memberCount: 1,
      });
      alert("Team created successfully.");
      setTeamName("");
      setSkills("");
      setView("");
      closeModal();
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team. Please try again later.");
    }
  };
 /* Validates user input and selection.
Prevents duplicate pending requests for the same team.
Adds a new join request document with status “pending” in Firestore.
Resets form and closes modal on success. */
  const handleJoinRequest = async () => {
    if (!joinMessage.trim()) {
      alert("Please enter a message to join the team.");
      return;
    }
    if (alreadyCreated || alreadyJoined || alreadyRequested) {
      alert(
        "You cannot create or join more than one team for the same hackathon."
      );
      return;
    }
    if (!user) {
      alert("User is not authenticated.");
      return;
    }
    if (!selectedTeamId) {
      alert("Please select a team to join.");
      return;
    }
    try {
      // Check if there is already a pending request for this team
      const requestsRef = collection(db, "joinRequests");
      const q = query(
        requestsRef,
        where("teamId", "==", selectedTeamId),
        where("userId", "==", user.uid),
        where("status", "==", "pending")
      );
      const existingRequests = await getDocs(q);
      if (!existingRequests.empty) {
        alert("You already have a pending request for this team.");
        return;
      }
      // Add new join request
      await addDoc(requestsRef, {
        hackathonId: hackathon.id,
        teamId: selectedTeamId,
        userId: user.uid,
        message: joinMessage.trim(),
        status: "pending",
        timestamp: new Date(),
      });
      alert("Join request sent.");
      setJoinMessage("");
      setSelectedTeamId(null);
      setView("");
      closeModal();
    } catch (error) {
      console.error("Error sending join request:", error);
      alert("Failed to send join request. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="participate-modal">
        <div className="participate-content">Loading...</div>
      </div>
    );
  }

  return (
    <div className="participate-modal">
      <div className="participate-content">
        {!view && (
          <>
            <h3>Participate in {hackathon.title}</h3>

            {(alreadyCreated || alreadyJoined) && (
              <p style={{ color: "red", marginBottom: 24 }}>
                You are already in a team for this hackathon.
              </p>
            )}

            {!alreadyCreated && !alreadyJoined && (
              <>
                <button onClick={() => setView("create")}>Create Team</button>
                <button onClick={() => setView("join")}>Join Team</button>
              </>
            )}

            {alreadyCreated || alreadyJoined || (alreadyRequested && (
              <p style={{ color: "orange", marginTop: 12 }}>
                {alreadyRequested
                  ? "You have a pending join request."
                  : ""}
              </p>
            ))}

            <button className="cancel-button" onClick={closeModal}>
              Cancel
            </button>
          </>
        )}

        {view === "create" && (
          <>
            <h3>Create Team in {hackathon.title}</h3>

            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Skills required (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />

            <button onClick={handleCreateTeam}>Create Team</button>

            <button onClick={() => setView("")}>Back</button>
          </>
        )}

        {view === "join" && (
          <>
            <h3>Available Teams</h3>

            {teams.length === 0 ? (
              <p>No teams available.</p>
            ) : (
              <div className="teams-list">
                {teams.map((team) => (
                  <div key={team.id} className="team-card">
                    <div className="team-header">
                      <h4>{team.teamName || "Unnamed Team"}</h4>

                      <p>
                        <b>Created By:</b>{" "}
                        {team.creatorProfile?.name || "Unknown"}
                      </p>

                      <p>
                        <b>Skills Required:</b>{" "}
                        {team.skillsRequired?.join(", ") || "None"}
                      </p>

                      <p>
                        <b>Members:</b>{" "}
                        {(team.memberProfiles || [])
                          .map((m) => (m ? m.name : "Unknown"))
                          .join(", ") || "None"}
                      </p>
                    </div>

                    {selectedTeamId === team.id ? (
                      <>
                        <textarea
                          placeholder="Message to join the team"
                          value={joinMessage}
                          onChange={(e) => setJoinMessage(e.target.value)}
                        ></textarea>

                        <button onClick={handleJoinRequest}>
                          Send Join Request
                        </button>

                        <button onClick={() => setSelectedTeamId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSelectedTeamId(team.id)}
                        style={{ marginTop: 12 }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              style={{ marginTop: 12 }}
              onClick={() => setView("")}
            >
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ParticipateModal;
