import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import "./TeamManage.css";

export default function TeamChat() {
  const { teamId } = useParams();
  const user = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!teamId) return;

    // Fetch team name
    const fetchTeamName = async () => {
      const teamDoc = await getDoc(doc(db, "teams", teamId));
      setTeamName(teamDoc.exists() ? teamDoc.data().teamName : "Team Chat");
    };
    fetchTeamName();

    // Real-time listener for messages, ordered by timestamp
    const q = query(
      collection(db, "teams", teamId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      // Scroll to bottom on new messages
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return unsubscribe;
  }, [teamId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await addDoc(collection(db, "teams", teamId, "messages"), {
        text: input.trim(),
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        timestamp: serverTimestamp(),
      });
      setInput("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="teamchat-container">
      <header className="teamchat-header">
        <h2>{teamName}</h2>
      </header>

      <div className="messages-list">
        {messages.map(({ id, text, userId, userName, timestamp }) => (
          <div
            key={id}
            className={`message-item ${userId === user.uid ? "my-message" : "other-message"}`}
          >
            <div className="message-author">{userName}</div>
            <div className="message-text">{text}</div>
            {timestamp?.toDate && (
              <div className="message-time">
                {timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" className="send-btn">Send</button>
      </form>
    </div>
  );
}
