import { Routes, Route } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import CatalogPage from "./pages/CatalogPage";
import PropertyPage from "./pages/PropertyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import FavoritesPage from "./pages/FavoritesPage";
import HistoryPage from "./pages/HistoryPage";
import SavedSearchesPage from "./pages/SavedSearchesPage";

export default function App() {
  const { user, loading, login, logout } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<CatalogPage user={user} />} />
        <Route path="/properties/:id" element={<PropertyPage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route path="/register" element={<RegisterPage onLogin={login} />} />
        <Route path="/recommendations" element={
          <PrivateRoute user={user} loading={loading}>
            <RecommendationsPage />
          </PrivateRoute>
        } />
        <Route path="/favorites" element={
          <PrivateRoute user={user} loading={loading}>
            <FavoritesPage />
          </PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute user={user} loading={loading}>
            <HistoryPage />
          </PrivateRoute>
        } />
        <Route path="/saved-searches" element={
          <PrivateRoute user={user} loading={loading}>
            <SavedSearchesPage />
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
}
