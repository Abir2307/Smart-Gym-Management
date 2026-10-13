import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("smart-gym-token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    let cancelled = false;

    api
      .me()
      .then((data) => {
        if (!cancelled) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (!cancelled && window.localStorage.getItem("smart-gym-token") === storedToken) {
          window.localStorage.removeItem("smart-gym-token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(credentials) {
    const data = await api.login(credentials);
    window.localStorage.setItem("smart-gym-token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    window.localStorage.removeItem("smart-gym-token");
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, token, loading, login, logout }}>{children}</AuthContext.Provider>;
}
