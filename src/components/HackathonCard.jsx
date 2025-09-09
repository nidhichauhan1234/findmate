//purpose - Displays key information for a single hackathon in a card layout 
//shows hackathon info proivdes a paticipate button
import React, { useState } from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";//icludes icons
import ParticipateModal from "./ParticipateModal";

const HackathonCard = ({ hackathon }) => {
  const [participateOpen, setParticipateOpen] = useState(false);

  return (
    <div className="hackathon-card">
      {hackathon.imageUrl && (
        <img src={hackathon.imageUrl} alt={hackathon.title} className="hackathon-image" />
      )}
      <div className="hackathon-details">
        <h3>{hackathon.title}</h3>
        <p>{hackathon.description}</p>
        <p><Calendar className="icon" /> {hackathon.date}</p>
        <p><MapPin className="icon" /> {hackathon.location}</p>
        <p><Trophy className="icon" /> {hackathon.prize || "Prize info coming soon"}</p>
        <button className="hackathon-button" onClick={() => setParticipateOpen(true)}>Participate</button>
        {participateOpen && (
          <ParticipateModal hackathon={hackathon} closeModal={() => setParticipateOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default HackathonCard;

