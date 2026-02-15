import { useState, useEffect } from "react";
import axios from "axios";
import NewDriversPanel from "./NewDrivers.jsx";
import DriverListPanel from "./DriverList.jsx";
import BookingListPanel from "./BookingList.jsx";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get("http://localhost:3001/api/users");
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await axios.get("http://localhost:3001/api/transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const viewRow = (row) => {
    alert(JSON.stringify(row, null, 2));
  };

  useEffect(() => {
    fetchUsers();
    fetchTransactions();
  }, []);

  if (loadingUsers || loadingTransactions) {
    return (
      <div className="admin-content">
        <div className="loading-state">Loading Admin Panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="panels-grid">
        <NewDriversPanel onChange={() => setRefreshKey(k => k + 1)} key={`nd-${refreshKey}`} />
        <DriverListPanel key={`dl-${refreshKey}`} />
      </div>
      
      <div style={{ marginTop: 30 }}>
        <BookingListPanel key={`bk-${refreshKey}`} />
      </div>
    </div>
  );
}