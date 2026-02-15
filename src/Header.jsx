import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import darkLogo from "/ambaturide-darklogo.png";
import defaultProfile from "/profile-pictures/default.jpg";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateUserFromStorage = () => {
      // Try to get user from 'user' localStorage first, then fallback to 'passenger'
      const savedUser = localStorage.getItem("user");
      const savedPassenger = localStorage.getItem("passenger");
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else if (savedPassenger) {
        // If passenger exists but user doesn't, sync them
        const passengerData = JSON.parse(savedPassenger);
        setUser(passengerData);
        localStorage.setItem("user", JSON.stringify(passengerData));
      }
    };

    // Initial load
    updateUserFromStorage();

    // Listen for storage changes (when profile picture is updated in another tab/component)
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "passenger") {
        updateUserFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event listener for same-tab updates
    const handleUserUpdate = () => {
      updateUserFromStorage();
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("passenger");
    setUser(null);
    window.location.href = "/";
  };

  // Function to get profile picture URL with cache busting
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return defaultProfile;
    
    // If it's already a full URL or data URL, return as is
    if (profilePicture.startsWith('http') || profilePicture.startsWith('data:')) {
      return profilePicture;
    }
    
    // If it's a path, construct the full URL with cache busting
    return `http://localhost:3001${profilePicture}?t=${Date.now()}`;
  };

  const navigateToSection = (id) => {
    // If already on home, scroll directly
    if (window.location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMenuOpen(false);
        return;
      }
    }
    // otherwise navigate to home and pass desired section in location state
    navigate("/", { state: { scrollTo: id } });
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src={darkLogo} alt="Ambaturide Logo" className="logo" />
        <h1 className="brand"><span>Ambatu</span>RIDE</h1>
      </div>

      <div
        className={`burger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span><span></span><span></span>
      </div>

      <nav className={`header-right ${menuOpen ? "open" : ""}`}>
        <button className="nav-link" onClick={() => navigateToSection("hero")}>Book a Ride</button>
        <button className="nav-link" onClick={() => navigateToSection("about")}>About Us</button>
        <button className="nav-link" onClick={() => navigate('/PassengerBookingStatus')}>Booking Status</button>
        <button className="nav-link" onClick={() => navigateToSection("contact")}>Contact us</button>

        {user ? (
          <div className="auth-buttons">
            <img
              src={getProfilePictureUrl(user.ProfilePicture)}
              alt="Profile"
              className="profile-pic"
              onClick={() => window.location.href = "/PassengerProfile"}
              onError={(e) => {
                e.target.src = defaultProfile;
              }}
            />
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="login" onClick={() => window.location.href = "/LoginHomepage"}>LOG-IN</button>
            <button className="register" onClick={() => window.location.href = "/LoginHomepage"}>REGISTER</button>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;