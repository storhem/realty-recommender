import { useState, useEffect } from "react";
import { recommendationsApi } from "../services/api";
import PropertyCard from "../components/PropertyCard";

export default function RecommendationsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationsApi.get().then((r) => setProperties(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.icon}>⭐</div>
        <div>
          <h1 style={S.title}>Рекомендации для вас</h1>
          <p style={S.sub}>Подобрано на основе ваших оценок и истории просмотров</p>
        </div>
      </div>

      {loading && <div style={S.center}><div className="spinner" /></div>}

      {!loading && properties.length > 0 && (
        <div style={S.grid}>
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}

      {!loading && properties.length === 0 && (
        <div style={S.empty}>
          <div style={S.emptyIcon}>🔍</div>
          <h3 style={S.emptyTitle}>Пока нет рекомендаций</h3>
          <p style={S.emptySub}>Оцените несколько объектов в каталоге, и мы подберём для вас похожие варианты</p>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 1280, margin: "0 auto", padding: "40px 40px 60px" },
  header: { display: "flex", alignItems: "center", gap: 20, marginBottom: 36 },
  icon: {
    width: 56, height: 56, background: "#FFF7ED", borderRadius: 16,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
  },
  title: { fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" },
  sub: { fontSize: 15, color: "#64748B", marginTop: 4 },
  center: { display: "flex", justifyContent: "center", padding: "80px 0" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  empty: { textAlign: "center", padding: "80px 0" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: "#1E293B", marginBottom: 10 },
  emptySub: { fontSize: 15, color: "#94A3B8", maxWidth: 400, margin: "0 auto" },
};
