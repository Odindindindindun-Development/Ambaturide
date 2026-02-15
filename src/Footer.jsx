import React from "react";
import Logo from "./assets/ambaturide-logo.png";
import SocialMedia from "./assets/social-media.png";
import PhoneIcon from "./assets/phone-call.png";
import QRCode from "./assets/qr-code.png";
import "./Footer.css";

function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Left: Brand */}
          <div className="footer-brand">
            <img src={Logo} alt="AmbatuRIDE" className="footer-logo" />
            <p className="brand-tag">Your reliable ride-hailing partner</p>
            <img src={SocialMedia} alt="Follow us" className="social-icons" />
          </div>

          {/* Contact */}
          <div className="footer-contact">
            <h4>Contact Us</h4>
            <div className="phone-contact">
              <img src={PhoneIcon} alt="Call" />
              <span>+63 920 401 4206</span>
            </div>
          </div>

          {/* QR */}
          <div className="footer-qr">
            <h4>Download App</h4>
            <div className="qr-container">
              <img src={QRCode} alt="Scan QR Code" />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 AmbatuRIDE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;