//Displays all teams the user has created or joined.
//Shows team details and relevant actions like managing or viewing and chatting.
//Handles loading state, authorization, and empty states gracefully.
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import "./MyTeam.css";

export default function MyTeams() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    async function fetchTeams() {
      setLoading(true);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setTeams([]);
        setLoading(false);
        return;
      }
      const userData = userSnap.data();

      // Collect team IDs (created + joined)
      let teamIds = [];
      if (userData.teamsJoined) {
        teamIds = [...userData.teamsJoined.map((t) => t.uid)];
      }
      const createdTeamsQuery = query(collection(db, "teams"), where("createdBy.uid", "==", user.uid));
      const createdTeamsSnap = await getDocs(createdTeamsQuery);
      teamIds = [...teamIds, ...createdTeamsSnap.docs.map((d) => d.id)];

      if (teamIds.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      // Fetch teams data
      const teamsData = await Promise.all(
        teamIds.map(async (id) => {
          const teamDoc = await getDoc(doc(db, "teams", id));
          return teamDoc.exists() ? { id: teamDoc.id, ...teamDoc.data() } : null;
        })
      );

      // Deduplicate by hackathon, keep first team per hackathon
      const uniqueTeamsByHackathon = [];
      const hackathonSet = new Set();
      for (const team of teamsData.filter(Boolean)) {
        if (!hackathonSet.has(team.hackathonId)) {
          hackathonSet.add(team.hackathonId);
          const hackathonDoc = await getDoc(doc(db, "hackathons", team.hackathonId));
          team.hackathonTitle = hackathonDoc.exists() ? hackathonDoc.data().title : "Unknown Hackathon";
          uniqueTeamsByHackathon.push(team);
        }
      }

      setTeams(uniqueTeamsByHackathon);
      setLoading(false);
    }
    fetchTeams();
  }, [user, navigate]);

  if (loading) return <div>Loading your teams...</div>;

  if (teams.length === 0) return <div>You are not part of any teams yet. Join or create one!</div>;

  return (
    <div className="myteams-container">
      <h1>My Teams</h1>
      <div className="team-list">
        {teams.map((team) => (
          <div key={team.id} className="team-card">
            <h2>{team.teamName}</h2>
            <p className="hackathon-title">{team.hackathonTitle}</p>
            <div>
              <strong>Members:</strong>{" "}
              {team.members && team.members.length > 0 ? (
                team.members.map((member) => (
                  <Link to={`/profile/${member.uid}`} key={member.uid} className="member-link">
                    {member.name}
                  </Link>
                ))
              ) : (
                <span>No members yet</span>
              )}
            </div>
            <div className="team-actions">
              {team.createdBy.uid === user.uid ? (
                <>
                  <button onClick={() => navigate(`/team/manage/${team.id}`)}>Manage Team</button>
                  <button onClick={() => navigate(`/team/chat/${team.id}`)}>Chat</button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate(`/team/view/${team.id}`)}>View Team</button>
                  <button onClick={() => navigate(`/team/chat/${team.id}`)}>Chat</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
