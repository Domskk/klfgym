import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);   

  const initAuth = () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setRole(parsed.role || "member");
      }
    } catch (err) {
      console.error("Auth init error:", err);
      // Clear corrupted storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, initAuth }}>
      {children}
    </AuthContext.Provider>
  );
};