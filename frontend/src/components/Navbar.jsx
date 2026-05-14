import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  const handleLogout = () => { onLogout(); navigate("/login"); };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? "#fff" : "rgba(255,255,255,0.75)",
    fontWeight: isActive(path) ? 600 : 400,
    fontSize: 14,
    padding: "6px 14px",
    borderRadius: 8,
    background: isActive(path) ? "rgba(255,255,255,0.15)" : hovered === path ? "rgba(255,255,255,0.08)" : "transparent",
    transition: "all .2s",
  });

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <Link to="/" style={S.brand}>
          <span style={S.logo}>🏠</span>
          <span>ДомПодбор</span>
        </Link>

        <div style={S.links}>
          {[
            { to: "/", label: "Каталог" },
            ...(user ? [
              { to: "/recommendations", label: "Рекомендации" },
              { to: "/favorites", label: "Избранное" },
              { to: "/history", label: "История" },
            ] : []),
          ].map(({ to, label }) => (
            <Link
              key={to} to={to}
              style={linkStyle(to)}
              onMouseEnter={() => setHovered(to)}
              onMouseLeave={() => setHovered(null)}
            >{label}</Link>
          ))}
        </div>

        <div style={S.auth}>
          {user ? (
            <>
              <span style={S.userName}>👤 {user.name || user.email}</span>
              <button onClick={handleLogout} style={S.logoutBtn}>Выйти</button>
            </>
          ) : (
            <>
              <Link to="/login" style={S.loginLink}>Войти</Link>
              <Link to="/register" style={S.registerBtn}>Регистрация</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
    boxShadow: "0 2px 20px rgba(37,99,235,.35)",
    position: "sticky", top: 0, zIndex: 100,
  },
  inner: {
    maxWidth: 1280, margin: "0 auto", padding: "0 32px",
    display: "flex", alignItems: "center", gap: 8, height: 64,
  },
  brand: {
    display: "flex", alignItems: "center", gap: 10,
    color: "#fff", fontWeight: 800, fontSize: 20, marginRight: 24,
    letterSpacing: "-0.5px", flexShrink: 0,
  },
  logo: { fontSize: 24 },
  links: { display: "flex", gap: 4, flex: 1 },
  auth: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  userName: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  logoutBtn: {
    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
    color: "#fff", padding: "6px 16px", borderRadius: 8, fontSize: 14,
    cursor: "pointer", transition: "all .2s",
  },
  loginLink: {
    color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500,
    padding: "6px 14px",
  },
  registerBtn: {
    background: "#fff", color: "#2563EB", fontWeight: 600,
    padding: "6px 18px", borderRadius: 8, fontSize: 14,
    transition: "all .2s",
  },
};
