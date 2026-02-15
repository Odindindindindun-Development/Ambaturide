import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Redirects to driver login if no driver present in localStorage (or stored object lacks DriverID)
 */
export function useRequireDriver() {
  const navigate = useNavigate();
  useEffect(() => {
    const raw = localStorage.getItem("driver") || localStorage.getItem("user");
    if (!raw) {
      alert("Driver access only. Please log in as a driver.");
      navigate("/DriverLogin", { replace: true });
      return;
    }
    try {
      const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!obj || !obj.DriverID) {
        alert("Driver access only. Please log in as a driver.");
        navigate("/DriverLogin", { replace: true });
      }
    } catch (e) {
      alert("Driver access only. Please log in as a driver.");
      navigate("/DriverLogin", { replace: true });
    }
  }, [navigate]);
}

/**
 * Redirects non-admins to home. (Set localStorage.isAdmin = "true" at admin login.)
 */
export function useRequireAdmin() {
  const navigate = useNavigate();
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      alert("Admin access only. Please log in as admin.");
      navigate("/", { replace: true });
    }
  }, [navigate]);
}