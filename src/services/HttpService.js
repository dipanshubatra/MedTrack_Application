import axios from "axios";
import { BASE_PATH } from "../routes/routeRegistry";

const errorEmitter = new EventTarget();

// Toast bus for API-level errors: App.jsx forwards "toast" events to the UI
// toast system, so 401/403 responses surface as non-intrusive toasts instead
// of blocking alert() dialogs (the intent documented in the interceptor below).
const emitToast = (message, type = "error") => {
  errorEmitter.dispatchEvent(new CustomEvent("toast", { detail: { message, type } }));
};

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8081",
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach the JWT token (saved on login in AuthContext) to every outgoing
// request. Without this, every call to a protected endpoint (equipment,
// orders, maintenance, ...) is rejected with 403 Forbidden since the
// backend now requires authentication on all routes except login/register.
API.interceptors.request.use(
  (config) => {
    const savedUser = sessionStorage.getItem("medtrack_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.token) {
          config.headers["Authorization"] = `Bearer ${user.token}`;
        }
      } catch (err) {
        console.error("Failed to parse user details for JWT header injection:", err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle 401/403 errors globally via toast events
// instead of blocking alert() dialogs.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      sessionStorage.removeItem("medtrack_user");
      emitToast("Session expired. Please login again.");
      // The SPA is hosted under a base path on GitHub Pages (BASE_PATH, e.g.
      // "/MedTrack_Application"). Redirecting to a bare "/login" bypasses it
      // and lands on a 404; mirror App.jsx's base-path handling so the
      // session-expiry redirect reaches the real login route.
      const pathname = window.location.pathname || "";
      const base = pathname.includes(BASE_PATH) ? BASE_PATH : "";
      window.location.href = `${base}/login`;
    } else if (status === 403) {
      emitToast("Access denied: You are not authorised to perform this action.");
    }
    else{
      console.error("API request failed:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export { errorEmitter };
export default API;