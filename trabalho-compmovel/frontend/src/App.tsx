import { useMemo, useState } from "react";

import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

interface User {
  name: string;
  email: string;
}

const STORAGE_KEY = "monitoramento:user";

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [view, setView] = useState<"login" | "register">("login");

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const handleLogin = (payload: User) => {
    setUser(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  if (!isAuthenticated || !user) {
    if (view === "register") {
      return (
        <Register
          onRegister={handleLogin}
          onBackToLogin={() => setView("login")}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setView("register")}
      />
    );
  }

  return <Dashboard userName={user.name} onLogout={handleLogout} />;
}

