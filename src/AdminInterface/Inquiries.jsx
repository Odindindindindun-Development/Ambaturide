import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Inquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/admin/inquiries");
        setItems(res.data.inquiries || []);
      } catch (err) {
        console.warn("Failed to fetch inquiries", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buildUrl = (p) => (p ? (p.startsWith("http") ? p : `http://localhost:3001${p}`) : null);

  if (loading) return <div className="panel loading-state">Loading inquiries…</div>;
  if (items.length === 0) return <div className="panel empty-state">No inquiries found.</div>;

  return (
    <div className="panel">
      <h2>Inquiries</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((q) => (
          <li key={q.InquiryID} style={{ padding: 12, borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>{q.FirstName} {q.LastName}</strong>
                <div style={{ color: "#666", fontSize: 13 }}>
                  {q.Country || "Philippines"} • {q.CountryCode || "+63"} {q.PhoneNumber || "(no phone)"}
                </div>
                <div style={{ color: "#666", fontSize: 13 }}>{q.Email}</div>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{q.Message}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#999" }}>{new Date(q.CreatedAt).toLocaleString()}</div>
                {q.AttachmentPath ? (
                  <a href={buildUrl(q.AttachmentPath)} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8 }}>
                    View Attachment
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}