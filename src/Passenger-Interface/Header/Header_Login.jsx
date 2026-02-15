import React, { useState } from "react";
import "./Header_Login.css";
import logo from "../../assets/ambaturide-logo.png";
import profileIcon from "../../assets/CEO.jpg";


function Header_Login() {
  const [dropdown, setDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on nav link click (mobile)
  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="logo" className="logo" />
        <span className="brand">AmbatuRIDE</span>
      </div>

      {/* Burger menu for mobile */}
      <div
        className={"burger" + (menuOpen ? " open" : "")}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation menu"
        tabIndex={0}
        role="button"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <nav className={"header-right" + (menuOpen ? " open" : "") }>
        <div className="profile-menu" onClick={() => setDropdown(!dropdown)}>
          <img src={profileIcon} alt="profile" className="profile-icon" />
          <span className="profile-name">Eulo Icon Sexcion</span>
          {dropdown && (
            <div className="dropdown">
              <p>Profile</p>
              <p>Log Out</p>
            </div>
          )}
        </div>

        <a href="#" onClick={handleNavClick}>Book a Ride</a>
        <a href="#" onClick={handleNavClick}>Booking Status</a>
        <a href="#" onClick={handleNavClick}>Profile</a>
        <a href="#" onClick={handleNavClick}>About Us</a>
        <a href="#" onClick={handleNavClick}>Help</a>
      </nav>
    </header>
  );
}

export default Header_Login;