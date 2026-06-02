import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { savedSearchesApi } from "../services/api";

const TYPE_LABELS = { apartment: "Квартира", house: "Дом", studio: "Студия", room: "Комната", commercial: "Коммерческая" };
const DEAL_LABELS = { sale: "Купить", rent: "Снять" };
const SORT_LABELS = {
  distance_asc: "по расстоянию",
  created_desc: "сначала новые",
  price_asc: "цена ↑",
  price_desc: "цена ↓",
  area_desc: "площадь ↓",
  price_per_m_asc: "цена за м² ↑",
};

export default function SavedSearchesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await savedSearchesApi.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Удалить сохранённый поиск?")) return;
    await savedSearchesApi.remove(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const apply = async (ss) => {
    if (ss.new_count > 0) {
      try { await savedSearchesApi.markSeen(ss.id); } catch {}
    }
    const p = ss.params || {};
    if (p.cityId || p.radiusKm) {
      const current = JSON.parse(localStorage.getItem("location_filter") || "{}");
      localStorage.setItem("location_filter", JSON.stringify({
        cityId: p.cityId ?? current.cityId ?? "tula",
        radiusKm: p.radiusKm ?? current.radiusKm ?? 50,
      }));
    }
    navigate("/");
    // дёрнуть подписчиков хука: на /  перезагрузка не нужна, но проще через reload
    window.location.reload();
  };

  if (loading) return <div style={S.loading}><div className="spinner" /></div>;

  if (!items.length) {
    return (
      <div style={S.empty}>
        <div style={S.emptyIcon}>💾</div>
        <h2 style={S.emptyTitle}>Нет сохранённых поисков</h2>
        <p style={S.emptySub}>
          Откройте каталог, настройте фильтры и нажмите «Сохранить поиск»,
          чтобы быстро возвращаться к нужным критериям.
        </p>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Сохранённые поиски</h1>
      <div style={S.list}>
        {items.map((ss) => (
          <div key={ss.id} style={S.card}>
            <div style={S.cardLeft}>
              <div style={S.name}>
                {ss.name}
                {ss.new_count > 0 && (
                  <span style={S.badge}>+{ss.new_count} новых</span>
                )}
              </div>
              <div style={S.chips}>
                {ss.params.deal_type && <Chip>{DEAL_LABELS[ss.params.deal_type]}</Chip>}
                {ss.params.type && <Chip>{TYPE_LABELS[ss.params.type]}</Chip>}
                {ss.params.rooms && <Chip>{ss.params.rooms}-комн.</Chip>}
                {ss.params.price_min && <Chip>от {Number(ss.params.price_min).toLocaleString("ru-RU")} ₽</Chip>}
                {ss.params.price_max && <Chip>до {Number(ss.params.price_max).toLocaleString("ru-RU")} ₽</Chip>}
                {ss.params.q && <Chip>«{ss.params.q}»</Chip>}
                {ss.params.sort && SORT_LABELS[ss.params.sort] && <Chip>{SORT_LABELS[ss.params.sort]}</Chip>}
                {ss.params.radiusKm && <Chip>радиус {ss.params.radiusKm} км</Chip>}
              </div>
            </div>
            <div style={S.cardActions}>
              <button style={S.applyBtn} onClick={() => apply(ss)}>Применить →</button>
              <button style={S.delBtn} onClick={() => remove(ss.id)} title="Удалить">🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({ children }) {
  return <span style={S.chip}>{children}</span>;
}

const S = {
  page: { maxWidth: 900, margin: "0 auto", padding: "40px 32px 64px" },
  h1: { fontSize: 32, fontWeight: 800, color: "#0F172A", marginBottom: 24, letterSpacing: "-0.5px" },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: {
    background: "#fff", borderRadius: 14,
    padding: "20px 24px",
    boxShadow: "0 2px 10px rgba(0,0,0,.06)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 16, flexWrap: "wrap",
  },
  cardLeft: { flex: 1, minWidth: 240 },
  name: {
    fontSize: 17, fontWeight: 700, color: "#0F172A",
    marginBottom: 10,
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
  },
  badge: {
    background: "#16A34A", color: "#fff",
    padding: "2px 10px", borderRadius: 12,
    fontSize: 12, fontWeight: 700,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    background: "#F1F5F9", color: "#475569",
    padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500,
  },
  cardActions: { display: "flex", gap: 8 },
  applyBtn: {
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "10px 18px", fontWeight: 700, fontSize: 14,
    cursor: "pointer", fontFamily: "inherit",
  },
  delBtn: {
    background: "#FEF2F2", color: "#EF4444",
    border: "1px solid #FECACA", borderRadius: 10,
    padding: "10px 14px", fontSize: 16, cursor: "pointer",
    fontFamily: "inherit",
  },

  loading: { display: "flex", justifyContent: "center", padding: 80 },
  empty: { maxWidth: 600, margin: "0 auto", padding: "80px 32px", textAlign: "center" },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: 700, color: "#1E293B", marginBottom: 10 },
  emptySub: { fontSize: 15, color: "#94A3B8", lineHeight: 1.6 },
};
