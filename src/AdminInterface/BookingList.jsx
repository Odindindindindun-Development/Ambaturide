import { useEffect, useState } from "react";
import axios from "axios";

export default function BookingListPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const dateOptions = { year: "numeric", month: "short", day: "numeric" };

  const formatDate = (val, fallbackTime) => {
    if (!val && !fallbackTime) return "";
    // If string is exactly YYYY-MM-DD, use it directly (no timezone shift)
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return new Date(val + "T00:00:00").toLocaleDateString("en-PH", dateOptions);
    }
    // Try normal Date parsing
    const d = new Date(val);
    if (!isNaN(d.getTime()) && d.getFullYear() >= 1970) {
      return d.toLocaleDateString("en-PH", dateOptions);
    }
    // Try extracting a yyyy-mm-dd part from the string
    if (typeof val === "string") {
      const m = val.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) return new Date(m[1] + "T00:00:00").toLocaleDateString("en-PH", dateOptions);
    }
    // If only a time was stored or date invalid, show fallback (RideTime) or empty
    return fallbackTime || "";
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/bookings");
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase() === 'completed' ? 'status-completed' : 
                       status?.toLowerCase() === 'active' ? 'status-active' : 'status-pending';
    return <span className={`status-badge ${statusClass}`}>{status || 'Pending'}</span>;
  };

  return (
    <div className="panel">
      <h2>Booking List</h2>
      
      {loading ? (
        <div className="loading-state">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No Bookings</h3>
          <p>There are no bookings in the system.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Passenger</th>
              <th>Driver</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Date</th>
              <th>Time</th>
              <th>Vehicle</th>
              <th>Fare</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.BookingID}>
                <td>#{b.BookingID}</td>
                <td><strong>{b.PassengerName || b.PassengerID}</strong></td>
                <td>{b.DriverName || b.DriverID || "—"}</td>
                <td>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>{b.PickupArea}</strong>
                    {b.PickupFullAddress && <div style={{ color: '#666', fontSize: '0.8rem' }}>{b.PickupFullAddress}</div>}
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>{b.DropoffArea}</strong>
                    {b.DropoffFullAddress && <div style={{ color: '#666', fontSize: '0.8rem' }}>{b.DropoffFullAddress}</div>}
                  </div>
                </td>
                <td>{formatDate(b.RideDate, b.RideTime)}</td>

                <td>{b.RideTime}</td>
                <td>{b.VehicleType}</td>
                <td><strong>₱{b.Fare}</strong></td>
                <td>{getStatusBadge(b.Status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}