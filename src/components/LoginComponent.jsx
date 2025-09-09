//purpose - it providess a loign form for users to authenticate using firebase authentication 
//with email and password on succesfull login redirects to home page 
//It uses Firebase Authentication email/password method.
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebaseConfig"; // make sure firebase.js is set up
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

const auth = getAuth(app);//initialize firebase authentication functions

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // to navigate between pages
 //defines component state variables for email password and erro message

  const handleLogin = async (e) => {
    e.preventDefault();//prevent page reload on form submit
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in as:", userCredential.user.uid);
      navigate("/home");//Redirect to Home page after successful login
    } catch (err) {
      setError("Invalid credentials or user not found.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login to FindMate</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email"
            placeholder="Email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button">Login</button>
          {error && <p className="error-text">{error}</p>}
        </form>
        <p>
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginComponent;
