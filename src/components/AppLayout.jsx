//purpose - provides a layout wrapper for your react router app 
//it shows navbar component on all pages except specified routes like login and signup page
import { Outlet, useLocation } from "react-router-dom";
import NavbarComponent from "./Navbar";
// Imports Outlet which acts as a placeholder to render matched child routes.
// Imports useLocation hook to get current URL path.


function AppLayout() {
  const location = useLocation();
   
  // Paths where navbar should NOT show:
  const noNavbarPaths = ["/login", "/signup"];

  return (
    <>
      {!noNavbarPaths.includes(location.pathname) && <NavbarComponent />}
      {/* Conditionally renders NavbarComponent only if current path is NOT in noNavbarPaths.
      Renders matched child routes content in place of */} 
      <Outlet />.
    </>
  );
}

export default AppLayout;
