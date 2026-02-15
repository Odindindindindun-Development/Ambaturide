import { useEffect, useState } from "react";
import axios from "axios";
import "./Admin.css";

export default function DriverListPanel() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchActiveDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/drivers?status=active");
      const list = res.data.drivers || [];

      // Fetch average rating per driver (parallel)
      const driversWithRating = await Promise.all(
        list.map(async (drv) => {
          try {
            const r = await axios.get(`http://localhost:3001/api/driver/${drv.DriverID}/ratings`);
            const ratings = r.data.ratings || [];
            const avg = ratings.length ? (ratings.reduce((s, it) => s + Number(it.Rating), 0) / ratings.length) : 0;
            return { ...drv, avgRating: Number(avg.toFixed(2)), ratingCount: ratings.length };
          } catch (err) {
            return { ...drv, avgRating: 0, ratingCount: 0 };
          }
        })
      );

      setDrivers(driversWithRating);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActiveDrivers(); }, []);

  const openReports = async (driver) => {
    setSelectedDriver(driver);
    setModalOpen(true);
    setReportsLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/driver-reports");
      const all = res.data.reports || [];
      const filtered = all.filter(r => Number(r.DriverID) === Number(driver.DriverID));
      setSelectedReports(filtered);
    } catch (err) {
      console.error("Failed to load reports", err);
      setSelectedReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const banDriver = async (driverId) => {
    if (!driverId) return;
    if (!confirm("Ban this driver? This will set their status to 'banned'.")) return;
    try {
      const res = await axios.put(`http://localhost:3001/api/admin/drivers/${driverId}/ban`);
      if (res.data.success) {
        alert("Driver banned.");
        fetchActiveDrivers();
      } else {
        alert("Failed to ban: " + (res.data.message || ""));
      }
    } catch (err) {
      console.error("Ban error", err);
      alert("Error banning driver.");
    }
  };

  return (
    <div className="panel">
      <h2>Drivers (Active)</h2>

      {loading ? (
        <div className="loading-state">Loading…</div>
      ) : drivers.length === 0 ? (
        <div className="empty-state">No active drivers.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Avg Rating</th>
              <th>Reports</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.DriverID}>
                <td>{d.DriverID}</td>
                <td>{d.FirstName} {d.LastName}</td>
                <td>{d.Email}</td>
                <td>{d.PhoneNumber}</td>
                <td>{d.VehicleBrand || "—"} / {d.PlateNumber || "—"}</td>
                <td>{d.avgRating ?? 0} ({d.ratingCount ?? 0})</td>
                <td>{d.Reports ?? 0}</td>
                <td>
                  <button onClick={() => openReports(d)} style={{ marginRight: 8 }}>View Reports</button>
                  <button onClick={() => banDriver(d.DriverID)} style={{ background: "#c62828", color: "#fff" }}>Ban</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Reports Modal */}
      {modalOpen && selectedDriver && (
        <div className="image-modal" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            <h3>{selectedDriver.FirstName} {selectedDriver.LastName} — Reports</h3>
            {reportsLoading ? (
              <div className="modal-loading">Loading reports…</div>
            ) : selectedReports.length === 0 ? (
              <div className="modal-empty">No reports for this driver.</div>
            ) : (
              <div className="reports-container">
                {selectedReports.map(r => (
                  <div key={r.ReportID} className="report-card">
                    <div className="report-header">
                      <div>
                        <div className="report-passenger">{r.PassengerName || `Passenger ${r.PassengerID}`}</div>
                        <div className="report-meta">{new Date(r.CreatedAt).toLocaleString()}</div>
                      </div>
                      <div className="report-booking">Booking: {r.BookingID || "—"}</div>
                    </div>
                    <div className="report-message">{r.Message || "(no message)"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}