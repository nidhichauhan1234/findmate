//purpose - provies a navigation bar with linkes to pages Home MyTeams Profile
//inlcudes sign OUt button to log out the user from firebase authentication and redirect to login page 
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig"; 
import "./home.css";

const NavbarComponent = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
      // it hangles sing out logged in user from firbase auth 
      //and it redirects to loign page 
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-logo">
          FindMate 
        </Link> {/* logo redirects to the home page */}
      </div>

      <div className="navbar-right">
         {/* Link to will navigate to target page */}
        <Link to="/home" className="navbar-link">
          Home
        </Link>
        <Link to="/teams" className="navbar-link">
          Teams
        </Link>
        <Link to="/myprofile" className="navbar-link">
          MyProfile
        </Link>
        <button onClick={handleSignOut} className="navbar-link signout-button">
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default NavbarComponent;
