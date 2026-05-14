import { useState, useEffect } from "react";
import { propertiesApi } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import MapView from "../components/MapView";

const TYPES = ["", "apartment", "house", "studio", "commercial"];
const TYPE_LABELS = { "": "Все типы", apartment: "Квартира", house: "Дом", studio: "Студия", commercial: "Коммерческая" };

export default function CatalogPage() {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({ type: "", price_min: "", price_max: "", rooms: "" });
  const [mapMode, setMapMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProperties = async (params = {}) => {
    setLoading(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries({ ...filters, ...params }).filter(([, v]) => v !== "")
      );
      const { data } = await propertiesApi.list(cleaned);
      setProperties(data);
    } finally {
      setLoading(false);
    }
  };

  const handleGeoSearch = async ({ lat, lon, radius }) => {
    setLoading(true);
    try {
      const { data } = await propertiesApi.geoSearch({ lat, lon, radius });
      setProperties(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  return (
    <div>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.heroTitle}>Найдите своё идеальное жильё</h1>
          <p style={S.heroSub}>Тысячи объектов недвижимости с персональными рекомендациями</p>

          <div style={S.searchBox}>
            <select
              style={S.searchSelect}
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <div style={S.divider} />
            <input style={S.searchInput} placeholder="Цена от, ₽" type="number"
              value={filters.price_min} onChange={(e) => setFilters({ ...filters, price_min: e.target.value })} />
            <div style={S.divider} />
            <input style={S.searchInput} placeholder="Цена до, ₽" type="number"
              value={filters.price_max} onChange={(e) => setFilters({ ...filters, price_max: e.target.value })} />
            <div style={S.divider} />
            <input style={{ ...S.searchInput, width: 90 }} placeholder="Комнат" type="number"
              value={filters.rooms} onChange={(e) => setFilters({ ...filters, rooms: e.target.value })} />
            <button style={S.searchBtn} onClick={() => fetchProperties()}>🔍 Найти</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={S.page}>
        <div style={S.toolbar}>
          <div>
            <span style={S.count}>{properties.length} объектов</span>
          </div>
          <button
            style={{ ...S.viewBtn, ...(mapMode ? S.viewBtnActive : {}) }}
            onClick={() => setMapMode(!mapMode)}
          >
            {mapMode ? "📋 Список" : "🗺 На карте"}
          </button>
        </div>

        {mapMode ? (
          <MapView properties={properties} onRadiusSearch={handleGeoSearch} />
        ) : (
          <>
            {loading && (
              <div style={S.loadingWrap}><div className="spinner" /></div>
            )}
            {!loading && (
              <div style={S.grid}>
                {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
            {!loading && properties.length === 0 && (
              <div style={S.empty}>
                <div style={S.emptyIcon}>🏘</div>
                <p style={S.emptyText}>Объекты не найдены</p>
                <p style={S.emptySub}>Попробуйте изменить параметры поиска</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  hero: {
    background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
    padding: "60px 32px 80px",
  },
  heroInner: { maxWidth: 900, margin: "0 auto", textAlign: "center" },
  heroTitle: { color: "#fff", fontSize: 40, fontWeight: 800, marginBottom: 12, letterSpacing: "-1px" },
  heroSub: { color: "rgba(255,255,255,.75)", fontSize: 18, marginBottom: 36 },
  searchBox: {
    background: "#fff",
    borderRadius: 16, padding: "8px 8px 8px 20px",
    display: "flex", alignItems: "center", gap: 0,
    boxShadow: "0 8px 32px rgba(0,0,0,.2)",
    maxWidth: 780, margin: "0 auto",
  },
  searchSelect: {
    border: "none", outline: "none", fontSize: 14, color: "#0F172A",
    background: "transparent", padding: "10px 8px", cursor: "pointer",
    fontFamily: "inherit", minWidth: 130,
  },
  searchInput: {
    border: "none", outline: "none", fontSize: 14, color: "#0F172A",
    background: "transparent", padding: "10px 12px", width: 140,
    fontFamily: "inherit",
  },
  divider: { width: 1, height: 28, background: "#E2E8F0", flexShrink: 0 },
  searchBtn: {
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "12px 28px", fontWeight: 700, fontSize: 15,
    cursor: "pointer", flexShrink: 0, marginLeft: 8,
  },
  page: { maxWidth: 1280, margin: "-28px auto 0", padding: "0 32px 48px", position: "relative" },
  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24, background: "#fff", borderRadius: 12,
    padding: "14px 20px", boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  },
  count: { fontWeight: 600, color: "#1E293B", fontSize: 15 },
  viewBtn: {
    border: "1px solid #E2E8F0", background: "#fff",
    borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 500,
    color: "#475569", cursor: "pointer", transition: "all .2s",
  },
  viewBtnActive: { background: "#EFF6FF", borderColor: "#2563EB", color: "#2563EB" },
  loadingWrap: { display: "flex", justifyContent: "center", padding: "80px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  empty: { textAlign: "center", padding: "80px 0" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 8 },
  emptySub: { fontSize: 15, color: "#94A3B8" },
};
