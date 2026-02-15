import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
  timeout: 10000,
  withCredentials: true,
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

api.interceptors.request.use((config) => {
  // const token = sessionStorage.getItem("access_token");
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

// DATABASE
function getDB() {
    const db = 'ambaturide_db';
}

// LOGIN
function getLoginData(email, password) {
    return email, password;
}

// TRANSACTIONS
function bookRide() {

}

function report() {
    
}

export default api;