import { useState, useEffect } from "react";
import axios from "axios";
import "./Css/PassengerBookingStatus.css";
import logo from "../assets/ambaturide-logo.png";
import Header from "../Header.jsx"
import { useNavigate } from "react-router-dom";

function PassengerBookingStatus() {
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState("none");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [passengerProfile, setPassengerProfile] = useState(null);
  const [passengerPhone, setPassengerPhone] = useState("");
  const [driverProfile, setDriverProfile] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [reporting, setReporting] = useState(false);
  const navigate = useNavigate();
  
  // Read PassengerID from localStorage with fallbacks (normalized)
  const getSavedPassengerId = () => {
    try {
      const raw =
        localStorage.getItem("PassengerID") ||
        localStorage.getItem("passenger") ||
        localStorage.getItem("user");
      if (!raw) return null;
      // If raw is a JSON object string (passenger), parse and return id
      if (raw.startsWith ? raw.startsWith("{") : false) {
        const obj = JSON.parse(raw);
        return obj.PassengerID || obj.id || obj.UserID || obj.PassengerId || null;
      }
      return raw;
    } catch (err) {
      console.error("Error reading passenger id from storage:", err);
      return null;
    }
  };

  const passengerId = getSavedPassengerId();

  const sanitizePhone = (phone) => {
    if (!phone) return "";
    return phone.toString().replace(/[+\-\s()]/g, "");
  };

  // Normalize image path -> full URL and timestamp
  const buildImageUrl = (path) => {
    if (!path) return "/profile-pictures/default.jpg";
    const raw = String(path);
    if (/^https?:\/\//i.test(raw) || /^\/\//.test(raw)) return raw;
    return `http://localhost:3001${raw.startsWith("/") ? raw : `/${raw}`}`;
  };
  const withTimestamp = (url) => (url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`);

  useEffect(() => {
    if (!passengerId) return;

    const fetchBooking = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/passenger/${passengerId}/booking`);
        if (res.data.booking) {
          const b = res.data.booking;

          // decide ratingSubmitted / rating using local checks and backend data without
          // resetting state prematurely — compute in local vars first
          let alreadySubmitted = false;
          let initialRating = 0;

          // 1) localStorage short-circuit: if user already rated this booking earlier
          try {
            const ratedRaw = localStorage.getItem("ratedBookings");
            const ratedList = ratedRaw ? JSON.parse(ratedRaw) : [];
            if (Array.isArray(ratedList) && ratedList.includes(Number(b.BookingID))) {
              alreadySubmitted = true;
            }
          } catch (e) {
            // ignore parse errors
          }

          // 2) prefer any rating fields already attached to booking
          const existingRating =
            Number(b.Rating) ||
            Number(b.PassengerRating) ||
            0;
          if (existingRating > 0) {
            alreadySubmitted = true;
            initialRating = existingRating;
          }

          // 3) If booking completed and still not determined, check driver_ratings table
          if (!alreadySubmitted && b.Status?.toLowerCase() === "completed" && b.DriverID && b.BookingID) {
            try {
              const rr = await axios.get(`http://localhost:3001/api/driver/${b.DriverID}/ratings`);
              const ratings = rr.data.ratings || rr.data || [];
              const found = ratings.find(r =>
                Number(r.BookingID) === Number(b.BookingID) &&
                Number(r.PassengerID) === Number(passengerId)
              );
              if (found) {
                alreadySubmitted = true;
                initialRating = Number(found.Rating) || initialRating;
              }
            } catch (err) {
              console.warn("Could not verify booking rating from ratings endpoint:", err);
            }
          }

          setBooking(b);
          setStatus(b.Status?.toLowerCase() || "pending");
          // set rating state once based on computed values
          setRating(initialRating);
          setRatingSubmitted(Boolean(alreadySubmitted));

          // Fetch passenger profile (to get profile picture / canonical phone)
          try {
            const p = await axios.get(`http://localhost:3001/api/passenger/profile/${passengerId}`);
            setPassengerProfile(p.data);
            setPassengerPhone(sanitizePhone(p.data.PhoneNumber));
          } catch (err) {
            console.warn("Failed to fetch passenger profile:", err);
          }

          // Fetch driver profile if a driver is assigned
          const driverId = b.DriverID || b.DriverId || b.driverId;
          if (driverId) {
            try {
              const d = await axios.get(`http://localhost:3001/api/driver/profile/${driverId}`);
              const driverObj = d.data?.driver || d.data;
              setDriverProfile(driverObj);
            } catch (err) {
              console.warn("Failed to fetch driver profile:", err);
            }
          }
        } else {
          setStatus("none");
        }
      } catch (err) {
        console.error("❌ Error fetching booking:", err);
      }
    };

    fetchBooking();
  }, [passengerId]);

  const formatDate = (iso) => {
    if (!iso) return "";
    // Use locale-aware date (may adjust for local timezone)
    const d = new Date(iso);
    if (isNaN(d)) return iso; // fallback if not a valid date
    return d.toLocaleDateString();
    // If you want the raw YYYY-MM-DD exactly as stored (no timezone shift), use:
    // return String(iso).split("T")[0];
  };

  const formatTime = (isoOrTime) => {
    if (!isoOrTime) return "";
    // If already a time like "07:35:00" return trimmed hh:mm
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(isoOrTime)) {
      return isoOrTime.slice(0,5);
    }
    const d = new Date(isoOrTime);
    if (isNaN(d)) return isoOrTime;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCancelBooking = async () => {
    if (!booking?.BookingID) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCanceling(true);
      const res = await axios.delete(`http://localhost:3001/api/bookings/${booking.BookingID}`, { withCredentials: true });
      if (res.data.success) {
        // clear booking and show "none" state
        setBooking(null);
        setStatus("none");
        // optional: navigate to home or show toast
        alert("Your booking has been cancelled.");
      } else {
        alert("Failed to cancel booking: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("An error occurred while cancelling the booking.");
    } finally {
      setCanceling(false);
    }
  };

  async function handleSubmitRating() {
    if (!booking?.BookingID) return;
    if (rating === 0) { alert("Please select a star rating."); return; }
    setRatingSubmitting(true);
    try {
      const res = await axios.post(`http://localhost:3001/api/bookings/${booking.BookingID}/rate`, {
        rating, comment
      }, { withCredentials: true });
      if (res.data.success) {
        // mark submitted and update local booking so refresh/state keeps rating state
        setRatingSubmitted(true);
        setBooking(prev => prev ? { ...prev, Rating: rating, PassengerRating: rating, RatingComment: comment, RatingID: res.data.ratingId || res.data.id || true } : prev);

        // locally remember this booking as rated to avoid UI showing again until backend reflects it
        try {
          const raw = localStorage.getItem("ratedBookings");
          let list = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(list)) list = [];
          if (!list.includes(Number(booking.BookingID))) {
            list.push(Number(booking.BookingID));
            localStorage.setItem("ratedBookings", JSON.stringify(list));
          }
        } catch (e) { /* ignore */ }

      } else {
        alert("Failed to submit rating");
      }
    } catch (err) {
      console.error("Rating error", err);
      alert("An error occurred while submitting your rating.");
    } finally {
      setRatingSubmitting(false);
    }
  }

  const handleReportDriver = async () => {
    if (!booking?.DriverID) return;
    
    const reportReason = prompt("Please briefly describe the issue with this driver:");
    if (!reportReason || reportReason.trim() === "") return;

    try {
      setReporting(true);
      const res = await axios.post(`http://localhost:3001/api/drivers/${booking.DriverID}/report`, {
        reason: reportReason.trim(),
        bookingId: booking.BookingID,
        passengerId: passengerId
      }, { withCredentials: true });

      if (res.data.success) {
        alert("Thank you for your report. We will review this driver.");
      } else {
        // server returned success:false with 200
        alert("Failed to submit report: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      // handle 429 / other server errors
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 429) {
        alert(serverMsg || "You have reached the report limit for this driver.");
      } else {
        console.error("Error reporting driver:", err);
        alert("An error occurred while submitting your report.");
      }
    } finally {
      setReporting(false);
    }
  };

  // if none — include Header so header always shows
  if (status === "none") {
    return (
      <>
        <Header />
        <div className="booking-status-container">
          <div className="booking-card">
            <h2>No active bookings found</h2>
            <p>Book a ride to see your booking status here.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header/>
      <div className="booking-status-container">
        <div className="booking-card">
          {/* Left Section */}
          <div className="left-section">
            {status === "pending" ? (
              <div className="pending-state">
                <h2 className="wait-title">Wait for your Driver</h2>
                <div className="status-badge-pending">Pending</div>
                <img src={logo} alt="AmbatURIDE" className="pending-logo" />
                {/* Cancel button for pending */}
              </div>
            ) : (
              <>
                {/* driver assigned view */}
                <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                  <div className="driver-assigned-header">
                    <h2 className="section-title">Your Driver</h2>
                  </div>
                  {/* allow cancel when driver assigned (optional) */}
                </div>

                <div className="driver-profile">
                  <div className="profile-picture">
                    <img
                      src={withTimestamp(buildImageUrl(driverProfile?.ProfilePicture || booking.DriverProfilePicture))}
                      alt={driverProfile?.FullName || booking.DriverName || "Driver"}
                      className="passenger-img"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/profile-pictures/default.jpg"; }}
                    />
                  </div>
                  <div className="driver-details">
                    <h3>{booking.DriverName}</h3>
                    <p>📞 {sanitizePhone(booking.DriverPhone)}</p>
                    <button 
                      className="btn report-btn" 
                      onClick={handleReportDriver}
                      disabled={reporting}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {reporting ? "Reporting..." : "Report Driver"}
                    </button>
                  </div>
                </div>

                <div className="vehicle-info">
                  <div className="car-image">
                    { /* Show vehicle image if available (driver profile or booking field), otherwise emoji placeholder */ }
                    { (driverProfile?.VehiclePicture || booking.VehiclePicture) ? (
                      <img
                        src={withTimestamp(buildImageUrl(driverProfile?.VehiclePicture || booking.VehiclePicture))}
                        alt="Vehicle"
                        className="car-image-img"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/profile-pictures/default-car.jpg"; }}
                      />
                    ) : (
                      <div className="car-img-placeholder">🚗</div>
                    )}
                  </div>
                  <div className="car-details">
                    <div className="detail-row">
                      <span className="label">Plate Number:&nbsp;&nbsp;</span>
                      <span className="value">{booking.PlateNumber}</span>
                      
                    </div>
                    <div className="detail-row">
                      <span className="label">Model:&nbsp;&nbsp;</span>
                      <span className="value">{booking.VehicleBrand}</span>
                    </div>
                    <div className="vehicle-row">
                      <span className="label">Type of vehicle:&nbsp;&nbsp;</span>
                      <span className="value">{booking.VehicleType}</span>
                    </div>
                  </div>
                  <div className="status-indicator">
                    <span className="status-badge-active">✔️ Driver Assigned</span>
                  </div>
                </div>

                {/* Rating only shown when booking completed */}
                {booking.Status?.toLowerCase() === "completed" && !ratingSubmitted && (
                  <div className="rating-section">
                    <h4>Rate the Driver</h4>
                    <div className="stars-container">
                      {[1,2,3,4,5].map((star) => (
                        <button key={star} className={`star-btn ${rating >= star ? "filled" : ""}`} onClick={() => setRating(star)}>★</button>
                      ))}
                    </div>
                    <div className="comments-section">
                      <label>Comments</label>
                      <textarea className="comments-input" placeholder="Share your experience..." rows="3" value={comment} onChange={(e)=>setComment(e.target.value)}></textarea>
                    </div>
                    <div style={{marginTop:12}}>
                      <button className="btn yellow-btn" onClick={handleSubmitRating} disabled={ratingSubmitting || rating===0}>
                        {ratingSubmitting ? "Submitting..." : "Submit Rating"}
                      </button>
                    </div>
                  </div>
                )}
                {ratingSubmitted && (
                  <div className="rating-thanks">Thanks for rating the driver!</div>
                )}
              </>
            )}
          </div>

          {/* Right Section - Trip Details */}
          {booking && (
            <div className="right-section">


              <div className="address-section">
                <div className="address-group">
                  <div className="address-label">📍 Pickup Full Address</div>
                  <div className="address-value">
                    <strong>{booking.PickupArea || "Unknown area"}</strong>
                    {booking.PickupFullAddress ? ` — ${booking.PickupFullAddress}` : ""}
                  </div>
                </div>
                <div className="address-group">
                  <div className="address-label">🎯 Dropoff Full Address</div>
                  <div className="address-value">
                    <strong>{booking.DropoffArea || "Unknown area"}</strong>
                    {booking.DropoffFullAddress ? ` — ${booking.DropoffFullAddress}` : ""}
                  </div>
                </div>
              </div>

              <div className="trip-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">📅 Date</div>
                    <div className="detail-value">{formatDate(booking.RideDate)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">🕐 Time</div>
                    <div className="detail-value">{formatTime(booking.RideTime || booking.RideDate)}</div>
                  </div>
                </div>
              </div>

              <div className="payment-section">
                <h3>Total Amount</h3>
                <div className="amount-breakdown">
                  <div className="breakdown-row total">
                    <span>TOTAL:</span>
                    <span className="total-amount">₱{booking.Fare}</span>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                {booking?.Status?.toLowerCase() !== "completed" && (
                  <button
                    className="btn cancel-ride-btn"
                    onClick={handleCancelBooking}
                    disabled={canceling}
                  >
                    {canceling ? "Cancelling..." : "Cancel Ride"}
                  </button>
                )}
                <button
                  className="btn home-btn"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PassengerBookingStatus;