import { useState } from "react";
import { Link } from "react-router-dom";

const TYPE_LABELS = { apartment: "Квартира", house: "Дом", studio: "Студия", commercial: "Коммерческая" };
const TYPE_COLORS = {
  apartment: { bg: "#EFF6FF", color: "#2563EB" },
  house: { bg: "#F0FDF4", color: "#16A34A" },
  studio: { bg: "#FFF7ED", color: "#EA580C" },
  commercial: { bg: "#F5F3FF", color: "#7C3AED" },
};

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80";

export default function PropertyCard({ property, extra }) {
  const [hovered, setHovered] = useState(false);
  const colors = TYPE_COLORS[property.type] ?? { bg: "#F1F5F9", color: "#64748B" };

  return (
    <div
      style={{ ...S.card, ...(hovered ? S.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={S.imgWrap}>
        <img
          src={property.photos?.[0] ?? PLACEHOLDER}
          alt={property.title}
          style={S.img}
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <span style={{ ...S.badge, background: colors.bg, color: colors.color }}>
          {TYPE_LABELS[property.type] ?? property.type}
        </span>
      </div>

      <div style={S.body}>
        <div style={S.price}>
          {property.price.toLocaleString("ru-RU")} <span style={S.currency}>₽</span>
        </div>
        <div style={S.title}>{property.title}</div>

        <div style={S.pills}>
          <span style={S.pill}>📐 {property.area} м²</span>
          <span style={S.pill}>🛏 {property.rooms} комн.</span>
        </div>

        <div style={S.address}>📍 {property.address}</div>

        {extra && <div style={S.extra}>{extra}</div>}

        <Link to={`/properties/${property.id}`} style={S.btn}>
          Смотреть объект →
        </Link>
      </div>
    </div>
  );
}

const S = {
  card: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,.07)",
    transition: "transform .2s, box-shadow .2s",
    display: "flex", flexDirection: "column",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 32px rgba(37,99,235,.15)",
  },
  imgWrap: { position: "relative", overflow: "hidden" },
  img: { width: "100%", height: 200, objectFit: "cover", display: "block", transition: "transform .3s" },
  badge: {
    position: "absolute", top: 12, left: 12,
    padding: "4px 12px", borderRadius: 20,
    fontSize: 12, fontWeight: 600,
  },
  body: { padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 },
  price: { fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" },
  currency: { fontSize: 16, fontWeight: 600, color: "#64748B" },
  title: { fontSize: 15, fontWeight: 600, color: "#1E293B", lineHeight: 1.4 },
  pills: { display: "flex", gap: 8 },
  pill: {
    background: "#F8FAFC", border: "1px solid #E2E8F0",
    borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#475569",
  },
  address: { fontSize: 13, color: "#94A3B8" },
  extra: { fontSize: 13 },
  btn: {
    marginTop: "auto",
    display: "block", textAlign: "center",
    padding: "10px 0",
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", fontWeight: 600, fontSize: 14,
    borderRadius: 10, transition: "opacity .2s",
  },
};
