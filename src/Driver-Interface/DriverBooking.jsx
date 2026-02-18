import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // added
import "./DriverCss/DriverBooking.css";
import DriverHeader from "../../src/DriverHeader.jsx";
import { useRequireDriver } from "../utils/authGuards.jsx"; // add this import

export default function DriverBooking() {
  useRequireDriver(); // <-- require driver

  const navigate = useNavigate(); // added
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  // driver status (active / pending / banned / inactive)
  const [driverStatus, setDriverStatus] = useState(null);

  // Require driver account to view driver pages
  useEffect(() => {
    const drv = localStorage.getItem("driver");
    if (!drv) {
      alert("Driver access only. Please log in as a driver.");
      navigate("/DriverLogin");
    }
  }, [navigate]);

  // ✅ Fetch bookings when component mounts
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const driverData = JSON.parse(localStorage.getItem("driver") || "{}");
        const driverId = driverData?.DriverID;
        const url = driverId
          ? `http://localhost:3001/api/driver/bookings?driverId=${driverId}`
          : "http://localhost:3001/api/driver/bookings";

        // Fetch current driver profile/status if logged in
        if (driverId) {
          try {
            const p = await fetch(`http://localhost:3001/api/driver/profile/${driverId}`);
            const pd = await p.json();
            // backend returns { success: true, driver: { ... } } or driver object
            const status = (pd?.driver?.Status) || pd?.Status || driverData?.Status || null;
            setDriverStatus(status ? String(status).toLowerCase() : null);
          } catch (err) {
            // fallback to localStorage value if request fails
            setDriverStatus(driverData?.Status ? String(driverData.Status).toLowerCase() : null);
          }
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setBookings(data.bookings);
        } else {
          console.error("No bookings found");
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Helper: remove "+" and "-" (and spaces/parentheses) from phone for display
  const sanitizePhone = (phone) => {
    if (!phone) return "";
    return phone.toString().replace(/[+\-\s()]/g, "");
  };

  // ✅ Filter pending bookings by location or name
  const filteredBookings = useMemo(() => {
    const q = (searchLocation || "").toLowerCase().trim();

    return bookings
      .filter((booking) => (booking.Status || "").toLowerCase() === "pending")
      .filter((booking) => {
        // normalize values with fallbacks from backend aliases
        const pickup = (booking.PickupFullAddress || booking.Origin || "").toString().toLowerCase();
        const dropoff = (booking.DropoffFullAddress || booking.Destination || "").toString().toLowerCase();
        const passenger = (booking.PassengerName || "").toString().toLowerCase();
        const pickupArea = (booking.PickupArea || "").toString().toLowerCase();
        const dropoffArea = (booking.DropoffArea || "").toString().toLowerCase();

        if (!q) return true;
        return (
          pickup.includes(q) ||
          dropoff.includes(q) ||
          passenger.includes(q) ||
          pickupArea.includes(q) ||
          dropoffArea.includes(q)
        );
      });
  }, [bookings, searchLocation]);

  const handleAccept = async (id) => {
    // block accept if driver not active
    if (driverStatus && driverStatus !== "active") {
      const msg = driverStatus === "banned"
        ? "Your account is banned and cannot accept bookings."
        : "Your account is not active (pending approval). You cannot accept bookings.";
      alert(msg);
      return;
    }
    setLoadingId(id);
    try {
      const driverData = JSON.parse(localStorage.getItem("driver") || "{}");
      const driverId = driverData?.DriverID;
      if (!driverId) {
        alert("Driver ID not found. Please log in again.");
        setLoadingId(null);
        return;
      }

      // use the backend route that updates booking status (and assign driver)
      const response = await fetch(`http://localhost:3001/api/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted", driverId }),
        credentials: "include" // include cookies if your server uses sessions
      });

      const data = await response.json();
      if (data.success) {
        // update local list or refetch to get fresh data from server
        setBookings((prev) =>
          prev.map((b) => (b.BookingID === id ? { ...b, Status: "accepted", DriverID: driverId } : b))
        );
      } else {
        console.error("Failed to accept:", data.message);
        alert("Could not accept ride: " + (data.message || "server error"));
      }
    } catch (err) {
      console.error("Accept error:", err);
      alert("Network or server error while accepting ride.");
    } finally {
      setLoadingId(null);
    }
  };

  // ✅ Reject ride
  const handleReject = async (id) => {
    setLoadingId(id);
    try {
      const driverData = JSON.parse(localStorage.getItem("driver"));
      const driverId = driverData?.DriverID;
      // tell backend this driver declined the booking
      const res = await fetch(`http://localhost:3001/api/driver/bookings/${id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const data = await res.json();
      if (data.success) {
        // remove from this driver's list immediately
        setBookings((prev) => prev.filter((b) => b.BookingID !== id));
      } else {
        console.error("Decline failed:", data.message);
      }
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const clearSearch = () => setSearchLocation("");

  const getInitials = (name) =>
    name
      ?.split(/\s+/) // split on spaces (works with "First Last")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();

  if (loading) return <p>Loading bookings...</p>;

  return (
    <>
      <DriverHeader />
      {/* show a clear notice if driver cannot accept bookings */}
      {driverStatus && driverStatus !== "active" && (
        <div className="driver-status-warning" style={{ padding: 12, background: "#fff3cd", color: "#856404", borderRadius: 6, margin: "12px auto", maxWidth: 980 }}>
          {driverStatus === "banned"
            ? "Your account is banned. You cannot accept bookings. Contact support for help."
            : "Your account is pending approval and cannot accept bookings yet. Please wait for admin approval."}
        </div>
      )}
      <div className="driver-booking-container">
        <div className="booking-content">
          <div className="search-header">
            <div className="location-title">
              <div className="location-badge">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h1>Passenger Bookings</h1>
              </div>
              <span className="booking-count">
                {filteredBookings.length} pending{" "}
                {filteredBookings.length === 1 ? "request" : "requests"}
              </span>
            </div>

            <div className="search-bar">
              <div className="search-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by location, destination, or passenger name..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="search-input"
              />
              {searchLocation && (
                <button className="clear-search" onClick={clearSearch}>
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              const pickup = booking.PickupFullAddress || booking.Origin || "";
              const dropoff = booking.DropoffFullAddress || booking.Destination || "";
              const pickupArea = booking.PickupArea || "Unknown area";
              const dropoffArea = booking.DropoffArea || "Unknown area";

              // booking.PassengerImage comes from server - handle both Cloudinary URLs and local paths
              const rawImage = booking.PassengerImage || booking.ProfilePicture;
              const passengerImage = rawImage
                ? (rawImage.startsWith('http') ? rawImage : `http://localhost:3001${rawImage}`)
                : "/profile-pictures/default.jpg";

              return (
                <div key={booking.BookingID} className="booking-card">
                  <div className="booking-header">
                    <div className="passenger-info">
                      <div className="avatar-container">
                        <img
                          src={passengerImage}
                          alt={booking.PassengerName || "Passenger"}
                          className="passenger-image"
                          onError={(e) => {
                            // fallback to default avatar if backend image fails
                            e.target.src = "/profile-pictures/default.jpg";
                            e.target.style.objectFit = "cover";
                          }}
                        />
                        <div className="avatar-fallback" aria-hidden>
                          {getInitials(booking.PassengerName)}
                        </div>
                      </div>
                      <div className="passenger-details">
                        <span className="label">Passenger</span>
                        <h3 className="passenger-name">{booking.PassengerName || "Unknown"}</h3>
                        {booking.PhoneNumber && (
                          <div className="passenger-phone">{sanitizePhone(booking.PhoneNumber)}</div>
                        )}
                      </div>
                    </div>
                    <div className="booking-badge pending">Pending</div>
                  </div>

                  <div className="trip-details">
                    <div className="route-info">
                      <div className="route-item">
                        <span className="route-label">From</span>
                        -                        <p className="route-text">{pickup}</p>
                        +                        <p className="route-text">{pickupArea}{pickup ? ` — ${pickup}` : ""}</p>
                      </div>
                      <div className="route-item">
                        <span className="route-label">To</span>
                        -                        <p className="route-text">{dropoff}</p>
                        +                        <p className="route-text">{dropoffArea}{dropoff ? ` — ${dropoff}` : ""}</p>
                      </div>
                    </div>

                    <div className="datetime-info">
                      <span>{booking.RideDate}</span> | <span>{booking.RideTime}</span>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(booking.BookingID)}
                      disabled={loadingId !== null}
                    >
                      Decline
                    </button>
                    <button
                      className="btn-accept"
                      onClick={() => handleAccept(booking.BookingID)}
                      disabled={loadingId !== null || (driverStatus && driverStatus !== "active")}
                      title={driverStatus && driverStatus !== "active" ? "Account not active" : "Accept booking"}
                    >
                      Accept Ride
                    </button>
                    {/* inline reason if accept disabled */}
                    {driverStatus && driverStatus !== "active" && (
                      <div style={{ marginTop: 8, color: "#b71c1c", fontSize: 13 }}>
                        {driverStatus === "banned" ? "Cannot accept — account banned." : "Cannot accept — pending approval."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="no-bookings">
              <h3>No pending requests</h3>
              <p>
                {searchLocation
                  ? `No bookings found for "${searchLocation}"`
                  : "All booking requests have been processed"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
