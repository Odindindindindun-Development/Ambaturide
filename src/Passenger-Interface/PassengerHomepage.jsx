import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "./Css/PassengerHomepage.css";

import homepageImg from "../assets/homepage-pic.png";
import ambatuLogo from "../assets/ambaturide-logo.png";
import dateIcon from "../assets/date.png";
import timeIcon from "../assets/time.png";
import Header from "../Header";
import Footer from '../Footer'
// New images
import how1 from "../assets/how-it-works.png";
import how2 from "../assets/how-it-works(2).png";
import how3 from "../assets/how-it-works(3).png";
import cityIllustration from "../assets/homepage-pic(2).png";
import ceoImg from "../assets/CEO.jpg";
import historyBg from "../assets/homepage(3).png";
import phFlag from "../assets/philippines.png";
import Logo from "../assets/ambaturide-logo.png";
import SocialMedia from "../assets/social-media.png";
import PhoneIcon from "../assets/phone-call.png";
import QRCode from "../assets/qr-code.png";

function PassengerHomepage() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("Now");
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactFile, setContactFile] = useState(null);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [isDriverAccount, setIsDriverAccount] = useState(false); // added
  const navigate = useNavigate();
  const location = useLocation();

  // detect driver account from localStorage (quick client-side guard)
  useEffect(() => {
    try {
      const drvRaw = localStorage.getItem("driver");
      if (drvRaw) {
        setIsDriverAccount(true);
        return;
      }
      const userRaw = localStorage.getItem("user") || localStorage.getItem("passenger");
      if (userRaw) {
        const obj = JSON.parse(userRaw);
        if (obj && (obj.DriverID || obj.role === "driver")) setIsDriverAccount(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    // If navigated with state.scrollTo, scroll to that section
    const target = location?.state?.scrollTo;
    if (target) {
      // small delay to ensure element rendered
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        // clear state so subsequent navigations don't re-scroll
        try { window.history.replaceState({}, document.title); } catch (e) {}
      }, 150);
    }
  }, [location]);

  const handleBookClick = async () => {
    // prevent drivers from requesting a passenger booking
    if (isDriverAccount) {
      alert("Driver accounts cannot request bookings. Please use the driver dashboard.");
      navigate("/DriverBooking");
      return;
    }

    try {
      const res = await axios.get("http://localhost:3001/api/check-auth", { withCredentials: true });
      if (!res.data.loggedIn) {
        navigate("/LoginHomepage");
        return;
      }

      // Resolve passenger ID: prefer localStorage, fallback to check-auth response
      let passengerId = null;
      try {
        const raw = localStorage.getItem("passenger");
        if (raw) {
          const obj = JSON.parse(raw);
          passengerId = obj.PassengerID || obj.id || obj.PassengerId || null;
        }
      } catch (err) {
        // ignore parse errors
      }
      // also block if server reports this user is a driver
      if (res.data.user && (res.data.user.DriverID || res.data.user.role === "driver")) {
        alert("Driver accounts cannot request bookings. Please use the driver dashboard.");
        navigate("/DriverBooking");
        return;
      }
      passengerId = passengerId || res.data.PassengerID || res.data.user?.PassengerID || res.data.user?.id || null;

      // If we have a passenger id, check for an existing active booking
      if (passengerId) {
        try {
          const check = await axios.get(`http://localhost:3001/api/passenger/${passengerId}/booking`, { withCredentials: true });
          const existing = check.data.booking;
          const activeStatuses = ["pending", "accepted", "assigned", "active"];
          if (existing && activeStatuses.includes((existing.Status || "").toLowerCase())) {
            alert("You already have an active booking. Please cancel it first to book another.");
            navigate("/PassengerBookingStatus", { state: { booking: existing } });
            return;
          }
        } catch (err) {
          console.warn("Could not verify existing booking — proceeding to booking page", err);
          // fall through to booking page
        }
      }

      // No blocking booking found — go to booking flow
      navigate("/Passenger_Booking");
    } catch (err) {
      console.error("Auth check failed", err);
      navigate("/LoginHomepage");
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactFirst || !contactLast || !contactPhone || !contactMessage) {
      alert("Please fill required fields (name, phone, message).");
      return;
    }
    try {
      setContactSubmitting(true);
      const form = new FormData();
      form.append("firstName", contactFirst);
      form.append("lastName", contactLast);
      form.append("phoneNumber", contactPhone);
      form.append("email", contactEmail);
      form.append("message", contactMessage);
      if (contactFile) form.append("attachment", contactFile);

      const res = await axios.post("http://localhost:3001/api/inquiries", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        alert("Inquiry submitted. Thank you.");
        setContactFirst(""); setContactLast(""); setContactPhone(""); setContactEmail(""); setContactMessage(""); setContactFile(null);
      } else {
        alert(res.data.message || "Failed to submit inquiry.");
      }
    } catch (err) {
      console.error("Contact submit error", err);
      alert("Failed to submit inquiry.");
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Go <span className="highlight">Anywhere</span>
              </h1>
              <p className="hero-subtitle">
                with{" "}
                <img src={ambatuLogo} alt="AmbatuRIDE Logo" className="mini-logo" />
                <span className="logo-text">AmbatuRIDE</span>
              </p>
              
              <div className="booking-form">
                <div className="input-group">
                  <input type="text" placeholder="Pickup Location" 
                  className="input-box"
                  value={pickup} onChange={(e) => setPickup(e.target.value)} />
                </div>
                
                <div className="input-group">
                  <input type="text" 
                  placeholder="Dropoff Location" 
                  className="input-box"
                  value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
                </div>

                <div className="datetime-row">
                  <button className="datetime-btn active">
                    <img src={dateIcon} alt="Date" className="icon-img" />
                    {date}
                  </button>
                  <button className="datetime-btn active">
                    <img src={timeIcon} alt="Time" className="icon-img" />
                    {time}
                  </button>
                </div>

                <button
                  className="cta-button primary"
                  onClick={handleBookClick}
                  disabled={isDriverAccount}
                  title={isDriverAccount ? "Driver accounts cannot request bookings" : "See Prices & Book Ride"}
                >
                  See Prices & Book Ride
                </button>
               {isDriverAccount && <div style={{ marginTop: 8, color: "#b71c1c", fontSize: 13 }}>Driver accounts cannot request passenger bookings.</div>}
              </div>
            </div>

            <div className="hero-image">
              <img src={homepageImg} alt="Comfortable ride experience" className="main-image" />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section - KEEPING ORIGINAL DESIGN */}
      <div id="how" className="how-it-works-section">
        <h2 className="how-headline">This is how it works</h2>

        <div className="how-step">
          <img src={how1} alt="Book a Ride" className="how-img" />
          <div className="how-text">
            <h3>Book a Ride</h3>
            <p>
              Open AmbatuRIDE, choose your destination, and request a driver with just a few taps.
            </p>
          </div>
        </div>

        <div className="how-step">
          <img src={how2} alt="Wait for your Driver" className="how-img" />
          <div className="how-text">
            <h3>Wait for your Driver</h3>
            <p>
              A nearby driver will accept your request and pick you up at your chosen location.
            </p>
          </div>
        </div>

        <div className="how-step">
          <img src={how3} alt="Arrive with Satisfaction" className="how-img" />
          <div className="how-text">
            <h3>Arrive with Satisfaction</h3>
            <p>
              Enjoy a safe and comfortable ride until you reach your destination with ease.
            </p>
          </div>
        </div>
      </div>

      {/* City Illustration */}
      <div className="city-illustration">
        <img src={cityIllustration} alt="City Illustration" />
      </div>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-content">
            <div className="about-brand">
              <h2>About <span className="highlight">AmbatuRIDE</span></h2>
              <p>Revolutionizing transportation with comfort, safety, and reliability at the core of everything we do.</p>
            </div>
            
            <div className="ceo-profile">
              <div className="ceo-image">
                <img src={ceoImg} alt="Mr. Perell Brown - CEO" />
              </div>
              <div className="ceo-info">
                <h3>Mr. Perell Brown</h3>
                <p className="ceo-title">CEO and Founder</p>
                <p className="ceo-quote">"Ambatu... give these people a ride."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="history-section">
        <div className="history-container">
          <div className="history-content">
            <div className="history-text">
              <h2>Our <span >Journey</span></h2>
              <p>Long ago, in the year of legends, one man had a dream...</p>
              <p>Mr Perell "Dreamybull" Brown saw the struggles of everyday commuters: waiting in the heat, waving at taxis that never stopped, and walking miles just to get home.</p>
              <p>He said one line that changed everything: <strong>"Ambatu... give these people a ride."</strong></p>
              <p>From that moment, AmbatuRIDE was born — a ride-hailing service built with passion and determination.</p>
            </div>
            
            <div className="history-image">
              <img src={historyBg} alt="AmbatuRIDE History" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <h2 className="section-title">Get In Touch</h2>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" className="form-input" value={contactFirst} onChange={(e)=>setContactFirst(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="form-input" value={contactLast} onChange={(e)=>setContactLast(e.target.value)} required />
                </div>
                
                <div className="form-group">
                  <label>Contact Number</label>
                  <div className="phone-input">
                    <img src={phFlag} alt="Philippines" className="flag" />
                    <span className="country-code">+63</span>
                    <input type="tel" className="phone-field" placeholder="9204014206" value={contactPhone} onChange={(e)=>setContactPhone(e.target.value)} required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-input" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} />
                </div>
              </div>
              
              <div className="form-column">
                <div className="form-group">
                  <label>Message</label>
                  <textarea className="message-input" rows="5" placeholder="How can we help you?" value={contactMessage} onChange={(e)=>setContactMessage(e.target.value)} required></textarea>
                </div>
                
                <div className="form-group">
                  <label>Attachment</label>
                  <div className="file-upload">
                    <input type="file" className="file-input" onChange={(e)=>setContactFile(e.target.files?.[0]||null)} />
                    <span className="file-label">{contactFile ? contactFile.name : "Choose file"}</span>
                  </div>
                </div>
                
                <button type="submit" className="cta-button secondary" disabled={contactSubmitting}>
                  {contactSubmitting ? "Sending…" : "Send Message"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <Footer/>
    </>
  );
}

export default PassengerHomepage;