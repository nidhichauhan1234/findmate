//purpose - displays a section listing upcomign hackathons 
//uses static array of hackathon objects as sample Data 
import React from "react";
import HackathonCard from "./HackathonCard";
//Array of Objects representing hackathons
const hackathons = [
  {
    id : "hack1",
    title: "Smart India Hackathon",
    description: "India Biggest Innovation Festival paticipate and contribute to innovation",
    date: "October 20, 2025",
    location: "India",
    prize: "1,00,000",
  },

  {
    id : "hack2",
    title: "Lean In Hackathon",
    description: "Innovate and collaborate with like-minded individuals",
    date : "september 20 2025",
    location: "IGDTUW ",
    prize: "$5,000 ",
    
  },
  { 
    id : "hack3",
    title: "Innovortex 3rd Edition 2025",
    description: "Participate in thelargest challenge-driven hackathon.",
    date: "October 2025",
    location: "IGDTUW",
    prize: "5,000",
  }
];
//HackathonCard component handles detailed rendering of each hackathon’s data with consistent card UI.
const HackathonSection = () => (
  <section className="hackathon-section">
    <h2>Upcoming Hackathons</h2>
    <div className="hackathon-grid">
      {hackathons.map((hackathon, index) => (
        <HackathonCard key={index} hackathon={hackathon} />
      ))}
    </div>
  </section>
);

export default HackathonSection;
