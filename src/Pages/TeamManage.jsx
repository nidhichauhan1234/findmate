import React from "react";
import { useParams } from "react-router-dom";
import ManageTeam from "../components/ManageTeam";
import "./TeamManage.css";

export default function TeamManage() {
  const { teamId } = useParams();

  return (
    <div style={{ padding: 40 }}>
      <h2>Manage Team</h2>
      <p>Team ID: {teamId}</p>
      <ManageTeam/>
    </div>
  );
}
