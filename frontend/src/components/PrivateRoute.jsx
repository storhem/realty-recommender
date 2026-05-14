import { Navigate } from "react-router-dom";

export default function PrivateRoute({ user, loading, children }) {
  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Загрузка...</div>;
  return user ? children : <Navigate to="/login" replace />;
}
