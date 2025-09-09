import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Login from "../Pages/Login";
import Signup from "../Pages/Signup";
import Profile from "../Pages/Profile";
import Home from "../Pages/Home";
import MyTeams from "../Pages/MyTeams";
import TeamChat from "../Pages/TeamChat";
import TeamManage from "../Pages/TeamManage";
import ProfileById from "../Pages/profileById";
import ViewTeam from "../Pages/ViewTeam";

// Simple 404 Page component
const PageNotFound = () => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/",
    element: <AppLayout />, // Includes Navbar, etc.
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "home", element: <Home /> },
      { path: "myprofile", element: <Profile /> },
      { path: "myteams", element: <MyTeams /> },
      { path: "teams", element: <Navigate to="/myteams" replace /> }, // Backward compatibility redirect
      { path: "team/chat/:teamId", element: <TeamChat /> },
      { path: "team/manage/:teamId", element: <TeamManage /> },
      { path: "profile/:userId", element: <ProfileById /> },
      { path: "team/view/:teamId", element: <ViewTeam /> },
      { path: "*", element: <PageNotFound /> }
    ]
  }
]);
