import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom"; // added useNavigate
import AdminManager from "./AdminManager.jsx";
import "./Admin.css";
import { useRequireAdmin } from "../utils/authGuards.jsx";

function Admin() {
  const navigate = useNavigate(); // added

  useEffect(() => {
    document.title = "Admin Dashboard";
  }, []);

  // simple client-side admin guard
  useEffect(() => {
    // set localStorage.setItem('isAdmin','true') when an admin logs in
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin || isAdmin !== "true") {
      alert("Admin access only. Please log in as admin.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useRequireAdmin(); // redirect non-admins

  return (
    <div className="admin-main-container">
      {/* Sidebar */}
      <AdminManager />

      {/* Dynamic content area */}
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Admin;
