import React, { useState, useEffect } from "react";
import axios from "axios";
import DriverHeader from '../../src/DriverHeader.jsx';
import { useRequireDriver } from "../utils/authGuards.jsx"; // add import
import "./DriverBookingStatus.css";

function DriverBookingStatus() {
  useRequireDriver(); // redirect non-drivers

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [error, setError] = useState(null);

  // Normalize image path -> full URL and append timestamp safely
  const buildImageUrl = (path) => {
    if (!path) return "/profile-pictures/default.jpg";
    const raw = String(path);
    if (/^https?:\/\//i.test(raw) || /^\/\//.test(raw)) return raw;
    const clean = raw.startsWith("/") ? raw : `/${raw}`;
    return `http://localhost:3001${clean}`;
  };

  const withTimestamp = (url) =>
    url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;

  const getDriverId = () => {
    try {
      const raw = localStorage.getItem("driver") || localStorage.getItem("user");
      if (!raw) return null;
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      return obj?.DriverID || obj?.id || null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const loadAssigned = async () => {
      const driverId = getDriverId();
      if (!driverId) {
        setError("Driver not logged in");
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:3001/api/driver/assigned-bookings/${driverId}`, { withCredentials: true });
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    loadAssigned();
  }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!bookingId) return;
    setSavingStatusId(bookingId);
    try {
      const res = await axios.put(`http://localhost:3001/api/bookings/${bookingId}/status`, {
        status: newStatus,
      }, { withCredentials: true });

      if (res.data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.BookingID === bookingId ? { ...b, Status: newStatus } : b))
        );
      } else {
        alert("Failed to update status: " + (res.data.message || ""));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating status");
    } finally {
      setSavingStatusId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-badge-pending';
      case 'accepted': return 'status-badge-accepted';
      case 'completed': return 'status-badge-completed';
      default: return 'status-badge-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date) ? dateString : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    // If it's already in HH:MM format
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    const date = new Date(timeString);
    return isNaN(date) ? timeString : date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <>
        <DriverHeader />
        <div className="driver-booking-status-container">
          <div className="loading-state">Loading bookings…</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DriverHeader />
        <div className="driver-booking-status-container">
          <div className="error-state">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <DriverHeader />
      <div className="driver-booking-status-container">
        <div className="bookings-header">
          <h1 className="page-title">Assigned Bookings</h1>
          <div className="bookings-count">{bookings.length} active booking{bookings.length !== 1 ? 's' : ''}</div>
        </div>

        {bookings.length === 0 ? (
          <div className="no-bookings-card">
            <div className="no-bookings-icon">🚗</div>
            <h3>No Active Bookings</h3>
            <p>You don't have any assigned bookings at the moment.</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <div key={booking.BookingID} className="booking-card">
                {/* Card Header */}
                <div className="card-header">
                  <div className="booking-id">Booking #{booking.BookingID}</div>
                  <div className={`status-badge ${getStatusBadgeClass(booking.Status)}`}>
                    {booking.Status || 'pending'}
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="passenger-section">
                  <div className="passenger-avatar">
                    <img
                      src={withTimestamp(buildImageUrl(booking.PassengerImage || booking.ProfilePicture || booking.PassengerProfilePicture || ""))}
                      alt={booking.PassengerName || "Passenger"}
                      className="passenger-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/profile-pictures/default.jpg";
                      }}
                    />
                  </div>
                  <div className="passenger-details">
                    <h3 className="passenger-name">
                      {booking.PassengerName || `${booking.FirstName || ""} ${booking.LastName || ""}`.trim() || "Passenger"}
                    </h3>
                    <div className="passenger-phone">
                      📞 {booking.PhoneNumber || booking.PassengerPhone || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="trip-details">
                  <div className="route-section">
                    <div className="route-point pickup">
                      <div className="route-marker">📍</div>
                      <div className="route-info">
                        <div className="route-label">Pickup</div>
                        <div className="route-address">
                          <strong>{booking.PickupArea || "Unknown area"}</strong>
                          {booking.PickupFullAddress && ` — ${booking.PickupFullAddress}`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="route-divider"></div>
                    
                    <div className="route-point dropoff">
                      <div className="route-marker">🎯</div>
                      <div className="route-info">
                        <div className="route-label">Dropoff</div>
                        <div className="route-address">
                          <strong>{booking.DropoffArea || "Unknown area"}</strong>
                          {booking.DropoffFullAddress && ` — ${booking.DropoffFullAddress}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="trip-meta">
                    <div className="meta-item">
                      <span className="meta-label">📅 Date</span>
                      <span className="meta-value">{formatDate(booking.RideDate)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">🕐 Time</span>
                      <span className="meta-value">{formatTime(booking.RideTime)}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">🚗 Vehicle</span>
                      <span className="meta-value">{booking.VehicleType || "Standard"}</span>
                    </div>
                  </div>
                </div>

                {/* Fare & Actions */}
                <div className="card-footer">
                  <div className="fare-section">
                    <div className="fare-label">Fare</div>
                    <div className="fare-amount">₱{booking.Fare || "0"}</div>
                  </div>
                  
                  <div className="actions-section">
                    <label className="status-label">Update Status</label>
                    <select
                      value={booking.Status || "pending"}
                      onChange={(e) => handleStatusChange(booking.BookingID, e.target.value)}
                      disabled={savingStatusId === booking.BookingID}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="completed">Completed</option>
                    </select>
                    {savingStatusId === booking.BookingID && (
                      <div className="saving-indicator">Saving...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default DriverBookingStatus;