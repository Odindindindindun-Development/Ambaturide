import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Admin.css";

export default function DriverReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || /^\/\//.test(path)) return path;
    return `http://localhost:3001${path.startsWith("/") ? path : `/${path}`}`;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/driver-reports");
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Failed to load driver reports", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const banDriver = async (driverId) => {
    if (!driverId) return;
    if (!window.confirm("Ban this driver? This will set their status to 'banned'.")) return;
    setProcessingId(driverId);
    try {
      // use convenience ban route
      const res = await axios.put(`http://localhost:3001/api/admin/drivers/${driverId}/ban`);
      if (res.data.success) {
        alert("Driver banned.");
        await fetchReports();
      } else {
        alert("Failed to ban driver: " + (res.data.message || ""));
      }
    } catch (err) {
      console.error("Ban error", err);
      alert("Error banning driver.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="panel">Loading reports…</div>;
  if (reports.length === 0) return <div className="panel">No reports found.</div>;

  return (
    <div className="panel">
      <h2>Driver Reports</h2>
      <div className="reports-list">
        {reports.map((r) => (
          <div key={r.ReportID} className="report-row" style={{ borderBottom: "1px solid #eee", padding: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: "0 0 64px" }}>
                <img
                  src={buildImageUrl(r.DriverPicture) || "/profile-pictures/default.jpg"}
                  alt={r.DriverName}
                  style={{ width:64, height:64, objectFit:"cover", borderRadius:8 }}
                  onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src="/profile-pictures/default.jpg"}}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{r.DriverName || `Driver ${r.DriverID}`}</strong>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      Reported by: {r.PassengerName || `Passenger ${r.PassengerID}`} • {new Date(r.CreatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color:"#333" }}>Reports: {r.Reports || 0}</div>
                    <button
                      disabled={processingId === r.DriverID}
                      onClick={() => banDriver(r.DriverID)}
                      style={{ marginTop: 8, padding: "6px 10px", background: "#c62828", color:"#fff", border:"none", borderRadius:6, cursor:"pointer" }}
                    >
                      {processingId === r.DriverID ? "Processing..." : "Ban Driver"}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 10, whiteSpace: "pre-wrap", color: "#222" }}>
                  {r.Message || "(no message)"}
                </div>

                {r.BookingID ? <div style={{ marginTop: 8, fontSize: 13, color:"#666" }}>Booking ID: {r.BookingID}</div> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}