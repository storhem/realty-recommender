import { useState, useEffect, useCallback } from "react";
import { propertiesApi, savedSearchesApi } from "../services/api";
import PropertyCard from "../components/PropertyCard";
import MapView from "../components/MapView";
import Pagination from "../components/Pagination";
import { useLocationFilter } from "../hooks/useLocationFilter";

const TYPES = ["", "apartment", "house", "studio", "room", "commercial"];
const TYPE_LABELS = { "": "Все типы", apartment: "Квартира", house: "Дом", studio: "Студия", room: "Комната", commercial: "Коммерческая" };
const DEAL_TYPES = [
  { value: "sale", label: "Купить" },
  { value: "rent", label: "Снять" },
];
const SORTS = [
  { value: "distance_asc",    label: "Ближе к центру" },
  { value: "created_desc",    label: "Сначала новые" },
  { value: "price_asc",       label: "Цена ↑" },
  { value: "price_desc",      label: "Цена ↓" },
  { value: "area_desc",       label: "Площадь ↓" },
  { value: "price_per_m_asc", label: "Цена за м² ↑" },
];
const PAGE_SIZE = 12;

const INITIAL_FILTERS = {
  q: "", type: "", deal_type: "sale",
  price_min: "", price_max: "", rooms: "",
  sort: "distance_asc",
};

export default function CatalogPage({ user }) {
  const { city, radiusKm } = useLocationFilter();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [mapMode, setMapMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const cleanedFilters = useCallback(() => {
    return Object.fromEntries(
      Object.entries(filters).filter(([k, v]) => v !== "" && !(k === "deal_type" && v === ""))
    );
  }, [filters]);

  const fetchProperties = useCallback(async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        lat: city.lat,
        lon: city.lon,
        radius: radiusKm * 1000,
        ...cleanedFilters(),
        limit: PAGE_SIZE,
        offset: (pageNum - 1) * PAGE_SIZE,
      };
      const { data, headers } = await propertiesApi.geoSearch(params);
      setProperties(data);
      setTotal(parseInt(headers["x-total-count"] || "0", 10));
    } finally {
      setLoading(false);
    }
  }, [city.id, city.lat, city.lon, radiusKm, cleanedFilters, page]);

  // Триггер при изменении города / радиуса / типа сделки / сортировки — со сбросом на 1 страницу
  useEffect(() => {
    setPage(1);
    fetchProperties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id, radiusKm, filters.deal_type, filters.sort]);

  const handleMapRadiusSearch = async ({ lat, lon, radius }) => {
    setLoading(true);
    try {
      const params = { lat, lon, radius, ...cleanedFilters(), limit: 100 };
      const { data, headers } = await propertiesApi.geoSearch(params);
      setProperties(data);
      setTotal(parseInt(headers["x-total-count"] || "0", 10));
    } finally {
      setLoading(false);
    }
  };

  const goPage = (p) => {
    setPage(p);
    fetchProperties(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyFilters = () => {
    setPage(1);
    fetchProperties(1);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const saveCurrentSearch = async () => {
    if (!user) { setSaveMsg("Войдите, чтобы сохранять поиски"); setTimeout(() => setSaveMsg(""), 2500); return; }
    const params = { ...cleanedFilters(), cityId: city.id, radiusKm };
    const parts = [];
    if (params.type) parts.push(TYPE_LABELS[params.type]);
    if (params.rooms) parts.push(`${params.rooms}-комн.`);
    parts.push(city.name);
    const name = parts.join(", ");
    try {
      await savedSearchesApi.create({ name, params });
      setSaveMsg("✓ Поиск сохранён");
    } catch {
      setSaveMsg("Не удалось сохранить");
    }
    setTimeout(() => setSaveMsg(""), 2500);
  };

  return (
    <div>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <h1 style={S.heroTitle}>Найдите своё идеальное жильё</h1>
          <p style={S.heroSub}>
            Объекты в радиусе {radiusKm} км от центра города {city.name}
          </p>

          {/* Deal type tabs */}
          <div style={S.dealTabs}>
            {DEAL_TYPES.map((d) => (
              <button
                key={d.value}
                style={{ ...S.dealTab, ...(filters.deal_type === d.value ? S.dealTabActive : {}) }}
                onClick={() => setFilters({ ...filters, deal_type: d.value })}
              >{d.label}</button>
            ))}
          </div>

          <div style={S.searchBox}>
            <input style={S.searchMain} placeholder="Поиск по адресу, описанию..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
            <button style={S.searchBtn} onClick={applyFilters}>🔍 Найти</button>
          </div>

          <div style={S.filtersRow}>
            <select style={S.select} value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input style={S.input} placeholder="Цена от, ₽" type="number"
              value={filters.price_min} onChange={(e) => setFilters({ ...filters, price_min: e.target.value })} />
            <input style={S.input} placeholder="Цена до, ₽" type="number"
              value={filters.price_max} onChange={(e) => setFilters({ ...filters, price_max: e.target.value })} />
            <input style={{ ...S.input, width: 80 }} placeholder="Комн." type="number"
              value={filters.rooms} onChange={(e) => setFilters({ ...filters, rooms: e.target.value })} />
            <button style={S.applyBtn} onClick={applyFilters}>Применить</button>
            <button style={S.resetBtn} onClick={resetFilters}>Сбросить</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={S.page}>
        <div style={S.toolbar}>
          <div>
            <span style={S.count}>{total} объектов</span>
            <span style={S.countNote}> · {city.name} +{radiusKm} км</span>
          </div>
          <div style={S.toolbarRight}>
            <select style={S.sortSelect} value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button style={S.saveBtn} onClick={saveCurrentSearch} title="Сохранить этот поиск">
              💾 Сохранить поиск
            </button>
            <button
              style={{ ...S.viewBtn, ...(mapMode ? S.viewBtnActive : {}) }}
              onClick={() => setMapMode(!mapMode)}
            >
              {mapMode ? "📋 Список" : "🗺 На карте"}
            </button>
          </div>
        </div>

        {saveMsg && <div style={S.toast}>{saveMsg}</div>}

        {mapMode ? (
          <MapView
            properties={properties}
            center={[city.lat, city.lon]}
            onRadiusSearch={handleMapRadiusSearch}
          />
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
                <p style={S.emptySub}>
                  Попробуйте увеличить радиус, изменить фильтры или выбрать другой город
                </p>
              </div>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={goPage} />
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  hero: {
    background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
    padding: "60px 32px 60px",
  },
  heroInner: { maxWidth: 900, margin: "0 auto", textAlign: "center" },
  heroTitle: { color: "#fff", fontSize: 38, fontWeight: 800, marginBottom: 10, letterSpacing: "-1px" },
  heroSub: { color: "rgba(255,255,255,.75)", fontSize: 17, marginBottom: 26 },

  dealTabs: {
    display: "inline-flex", gap: 4,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 10, padding: 4, marginBottom: 16,
  },
  dealTab: {
    padding: "8px 22px",
    background: "transparent", border: "none",
    borderRadius: 8, fontWeight: 600, fontSize: 14,
    color: "rgba(255,255,255,0.7)", cursor: "pointer",
    fontFamily: "inherit", transition: "all .15s",
  },
  dealTabActive: { background: "#fff", color: "#2563EB" },

  searchBox: {
    background: "#fff",
    borderRadius: 14, padding: "6px 6px 6px 18px",
    display: "flex", alignItems: "center",
    boxShadow: "0 8px 28px rgba(0,0,0,.2)",
    maxWidth: 720, margin: "0 auto 12px",
  },
  searchMain: {
    flex: 1, border: "none", outline: "none",
    fontSize: 15, color: "#0F172A",
    padding: "12px 0", fontFamily: "inherit", background: "transparent",
  },
  searchBtn: {
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "12px 26px", fontWeight: 700, fontSize: 14,
    cursor: "pointer", flexShrink: 0,
    fontFamily: "inherit",
  },

  filtersRow: {
    display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8,
    maxWidth: 720, margin: "0 auto",
  },
  select: {
    border: "none", outline: "none",
    background: "rgba(255,255,255,0.95)",
    color: "#0F172A", fontSize: 14, fontFamily: "inherit",
    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
    minWidth: 130,
  },
  input: {
    border: "none", outline: "none",
    background: "rgba(255,255,255,0.95)",
    color: "#0F172A", fontSize: 14, fontFamily: "inherit",
    padding: "9px 12px", borderRadius: 8, width: 130,
  },
  applyBtn: {
    background: "rgba(255,255,255,0.22)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.4)",
    padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  resetBtn: {
    background: "transparent", color: "rgba(255,255,255,0.75)",
    border: "1px solid rgba(255,255,255,0.25)",
    padding: "9px 14px", borderRadius: 8, fontSize: 13,
    cursor: "pointer", fontFamily: "inherit",
  },

  page: { maxWidth: 1280, margin: "-28px auto 0", padding: "0 32px 48px", position: "relative" },
  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24, background: "#fff", borderRadius: 12,
    padding: "14px 20px", boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    flexWrap: "wrap", gap: 12,
  },
  toolbarRight: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  count: { fontWeight: 600, color: "#1E293B", fontSize: 15 },
  countNote: { color: "#94A3B8", fontSize: 14, fontWeight: 400 },
  sortSelect: {
    border: "1px solid #E2E8F0", background: "#fff",
    borderRadius: 8, padding: "7px 12px", fontSize: 14,
    color: "#475569", cursor: "pointer", fontFamily: "inherit",
  },
  saveBtn: {
    background: "#F0FDF4", color: "#16A34A",
    border: "1px solid #BBF7D0",
    borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  viewBtn: {
    border: "1px solid #E2E8F0", background: "#fff",
    borderRadius: 8, padding: "7px 16px", fontSize: 14, fontWeight: 500,
    color: "#475569", cursor: "pointer", transition: "all .2s",
    fontFamily: "inherit",
  },
  viewBtnActive: { background: "#EFF6FF", borderColor: "#2563EB", color: "#2563EB" },

  toast: {
    position: "fixed", bottom: 24, right: 24,
    background: "#0F172A", color: "#fff",
    padding: "12px 20px", borderRadius: 10,
    fontSize: 14, fontWeight: 600, zIndex: 1000,
    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
  },

  loadingWrap: { display: "flex", justifyContent: "center", padding: "80px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  empty: { textAlign: "center", padding: "80px 0" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 8 },
  emptySub: { fontSize: 15, color: "#94A3B8" },
};
