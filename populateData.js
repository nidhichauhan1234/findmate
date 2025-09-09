import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

// Your Firebase config here (copy exactly from your firebaseConfig.js)
const firebaseConfig = {
  apiKey: "AIzaSyDq7_MRHswL7O6ytQI-pUfYTRRE00Y1d8U",
  authDomain: "findmate-6f2aa.firebaseapp.com",
  projectId: "findmate-6f2aa",
  storageBucket: "findmate-6f2aa.firebasestorage.app",
  messagingSenderId: "428245627783",
  appId: "1:428245627783:web:6fe6e4df4f6f5bbad65922"
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
  // Create sample users
  const users = [
    {
      uid: "user1uid",
      name: "John Doe",
      email: "john@example.com",
      batch: "2024",
      branch: "CSE",
      college: "ABC University",
      skills: ["React", "Firebase"],
      teamsJoined: [],
      profilePicture: "",
    },
    {
      uid: "user2uid",
      name: "Alice Smith",
      email: "alice@example.com",
      batch: "2025",
      branch: "ECE",
      college: "XYZ College",
      skills: ["AWS", "Node.js"],
      teamsJoined: [],
      profilePicture: "",
    },
  ];

  for (const user of users) {
    await setDoc(doc(db, "users", user.uid), user);
    console.log(`User ${user.name} added`);
  }

  // Create sample hackathons
  const hackathons = [
    {
      id: "hack1",
      title: "Smart India Hackathon",
      description: "India Biggest Innovation Festival...",
      date: "2025-10-20",
      location: "India",
      prize: "1,00,000",
      tags: ["Innovation", "Tech"],
    },
    {
      id: "hack2",
      title: "AI Hackathon 2025 Boston",
      description: "Compete for cash prizes and showcase AI solutions.",
      date: "2025-05-10",
      location: "Boston, MA",
      prize: "$20,000",
      tags: ["AI", "Machine Learning"],
    },
  ];

  for (const hackathon of hackathons) {
    await setDoc(doc(db, "hackathons", hackathon.id), hackathon);
    console.log(`Hackathon ${hackathon.title} added`);
  }

  // Create a sample team
  const teamRef = await addDoc(collection(db, "teams"), {
    hackathonId: "hack1",
    teamName: "Team Alpha",
    skillsRequired: ["React", "Firebase"],
    members: [{ uid: "user1uid", name: "John Doe", skills: ["React"] }],
    createdBy: { uid: "user1uid", name: "John Doe", email: "john@example.com" },
    memberCount: 1,
  });
  console.log("Sample Team Alpha added with ID:", teamRef.id);

  // Create a sample join request (link to the created team)
  await addDoc(collection(db, "joinRequests"), {
    hackathonId: "hack1",
    teamId: teamRef.id,
    userId: "user2uid",
    message: "I would like to join your team!",
    status: "pending",
    timestamp: new Date(),
  });
  console.log("Sample join request added");
}

// Run the seed function
seedFirestore()
  .then(() => {
    console.log("Firestore seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding Firestore:", error);
    process.exit(1);
  });
