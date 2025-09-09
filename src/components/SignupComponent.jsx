//purpose - it allows new user create an account by name email and password 
//use firebase authenticationf to create the user 
//it also create user document in collection firestore to store additional user info like skills like college branch aage edit profile mein
//redirects user to the login page upon successful signup
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import "./signup.css";

const auth = getAuth(app);//intializes firebase authentication service using app config

function SignupComponent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  //state variables store user input 

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // user add krega firestore mein 
      await updateProfile(user, { displayName: name });

      // Create Firestor document under users collection with this data 
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        batch: "",
        branch: "",
        college: "",
        skills: [],
        teamsJoined: [],
        profilePicture: "",
      });

      alert("Account created successfully!");
      navigate("/login");//jasi signup hua login page pe redirect hogye 
    } catch (err) {
      setError(err.message);
    }
  };
  //idhar it takes input and 
  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create an Account</h2>
        <form onSubmit={handleSignup}>
          <input
            className="signup-input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
        
          />
          <input
            className="signup-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="signup-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit" className="signup-button">Sign Up</button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default SignupComponent;
