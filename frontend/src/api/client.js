import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT to every outgoing request if we have one stored.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("artfit_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a token has expired/is invalid, clear local auth state so the UI can react.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("artfit_token");
      localStorage.removeItem("artfit_user");
    }
    return Promise.reject(error);
  }
);

export default api;
