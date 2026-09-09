import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/auth/me").then(r => setAdmin(r.data.admin)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const login = async (username, password) => { const r = await api.post("/auth/login", { username, password }); setAdmin(r.data.admin); };
  const logout = async () => { await api.post("/auth/logout"); setAdmin(null); };
  return <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
