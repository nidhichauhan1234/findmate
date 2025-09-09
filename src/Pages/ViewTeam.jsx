import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import "./TeamManage.css";

export default function ViewTeam() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTeam() {
      try {
        const teamDoc = await getDoc(doc(db, "teams", teamId));
        if (!teamDoc.exists()) {
          setError("Team not found.");
          setLoading(false);
          return;
        }
        const teamData = { id: teamDoc.id, ...teamDoc.data() };

        // Fetch hackathon title
        const hackathonDoc = await getDoc(doc(db, "hackathons", teamData.hackathonId));
        teamData.hackathonTitle = hackathonDoc.exists() ? hackathonDoc.data().title : "Unknown Hackathon";

        setTeam(teamData);
        setLoading(false);
      } catch {
        setError("Failed to fetch team data.");
        setLoading(false);
      }
    }
    fetchTeam();
  }, [teamId]);

  if (loading) return <div className="loading-message">Loading team details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!team) return null;

  return (
    <div className="team-view-container">
      <h2 className="team-title">{team.teamName}</h2>
      <p className="team-hackathon">
        <strong>Hackathon:</strong> {team.hackathonTitle}
      </p>
      <div className="team-members-section">
        <strong>Members ({team.memberCount}):</strong>
        <ul className="team-members-list">
          {team.members.map((m) => (
            <li key={m.uid}>
              <Link to={`/profile/${m.uid}`}>{m.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
