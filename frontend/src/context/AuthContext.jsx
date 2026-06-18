import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("artfit_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("artfit_token");
    if (!token) {
      setLoading(false);
      return;
    }
    // Verify the token is still valid and refresh user data.
    api
      .get("/me")
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem("artfit_user", JSON.stringify(res.data.user));
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("artfit_token");
        localStorage.removeItem("artfit_user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("artfit_token", token);
    localStorage.setItem("artfit_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("artfit_token");
    localStorage.removeItem("artfit_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
