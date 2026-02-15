import { useEffect, useState } from "react";
import axios from "axios";

export default function NewDriversPanel({ onChange }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/drivers?status=pending");
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error("Failed to load pending drivers", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const updateStatus = async (driverId, newStatus) => {
    if (!driverId) return;
    const action = newStatus === "active" ? "accept" : "reject";
    if (!confirm(`Are you sure you want to ${action} this driver?`)) return;
    
    setProcessingId(driverId);
    try {
      const res = await axios.put(`http://localhost:3001/api/admin/drivers/${driverId}/status`, { status: newStatus });
      if (res.data.success) {
        await fetchPending();
        if (onChange) onChange();
      } else {
        alert("Failed: " + (res.data.message || "unknown"));
      }
    } catch (err) {
      console.error("Update error", err);
      alert("Error updating driver status");
    } finally {
      setProcessingId(null);
    }
  };

  const buildImageUrl = (path) => {
    if (!path) return null;
    const raw = String(path);
    if (/^https?:\/\//i.test(raw) || /^\/\//.test(raw)) return raw;
    return `http://localhost:3001${raw.startsWith("/") ? raw : `/${raw}`}`;
  };

  const openImageModal = (imageUrl, caption) => {
    setModalImage({ url: imageUrl, caption });
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  return (
    <div className="panel">
      <h2>New Drivers (Pending)</h2>
      
      {loading ? (
        <div className="loading-state">Loading pending drivers...</div>
      ) : drivers.length === 0 ? (
        <div className="empty-state">
          <h3>No Pending Drivers</h3>
          <p>There are no drivers waiting for approval.</p>
        </div>
      ) : (
        <div className="drivers-list">
          {drivers.map((d) => (
            <div key={d.DriverID} className="driver-row">
              <div className="driver-info">
                <img 
                  src={d.ProfilePicture ? buildImageUrl(d.ProfilePicture) : "/profile-pictures/default.jpg"}
                  alt={`${d.FirstName} ${d.LastName}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/profile-pictures/default.jpg";
                  }}
                />
                <div className="driver-details">
                  <div><strong>{d.FirstName} {d.LastName}</strong></div>
                  <div>📧 {d.Email}</div>
                  <div>📞 {d.PhoneNumber}</div>
                  <div className="status-badge status-pending">Pending Review</div>

                  {/* Media thumbnails with zoom buttons */}
                  <div className="driver-media">
                    {/* Vehicle Image */}
                    {d.VehiclePicture ? (
                      <div className="media-thumb vehicle-thumb">
                        <img
                          src={buildImageUrl(d.VehiclePicture)}
                          alt="Vehicle"
                          onError={(e) => { 
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = "/profile-pictures/default-car.jpg"; 
                          }}
                        />
                        <button 
                          className="zoom-btn small"
                          onClick={() => openImageModal(buildImageUrl(d.VehiclePicture), `${d.FirstName}'s Vehicle`)}
                          title="Zoom vehicle image"
                        >
                          🔍
                        </button>
                      </div>
                    ) : (
                      <div className="media-thumb placeholder">No vehicle</div>
                    )}

                    {/* License Image */}
                    {d.LicenseImage ? (
                      <div className="media-thumb license-thumb">
                        <img
                          src={buildImageUrl(d.LicenseImage)}
                          alt="License"
                          onError={(e) => { 
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = "/profile-pictures/default.jpg"; 
                          }}
                        />
                        <button 
                          className="zoom-btn small"
                          onClick={() => openImageModal(buildImageUrl(d.LicenseImage), `${d.FirstName}'s License`)}
                          title="Zoom license image"
                        >
                          🔍
                        </button>
                      </div>
                    ) : (
                      <div className="media-thumb placeholder">No license</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="driver-actions">
                <button 
                  className="green"
                  disabled={processingId === d.DriverID} 
                  onClick={() => updateStatus(d.DriverID, "active")}
                >
                  {processingId === d.DriverID ? "Processing..." : "Accept"}
                </button>
                <button 
                  className="red"
                  disabled={processingId === d.DriverID} 
                  onClick={() => updateStatus(d.DriverID, "inactive")}
                >
                  {processingId === d.DriverID ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {modalImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={modalImage.url} alt={modalImage.caption} />
            <button className="modal-close" onClick={closeImageModal}>×</button>
            <div className="modal-caption">{modalImage.caption}</div>
          </div>
        </div>
      )}
    </div>
  );
}