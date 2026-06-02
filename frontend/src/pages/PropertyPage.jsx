import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { propertiesApi, ratingsApi, favoritesApi } from "../services/api";
import MapView from "../components/MapView";
import PhotoCarousel from "../components/PhotoCarousel";
import MortgageCalculator from "../components/MortgageCalculator";
import SimilarProperties from "../components/SimilarProperties";
import ShareButton from "../components/ShareButton";

const TYPE_LABELS = { apartment: "Квартира", house: "Дом", studio: "Студия", room: "Комната", commercial: "Коммерческая" };
const DEAL_LABELS = { sale: "Продажа", rent: "Аренда" };
const RENOVATION_LABELS = {
  none: "Без ремонта",
  cosmetic: "Косметический",
  euro: "Евроремонт",
  designer: "Дизайнерский",
};

export default function PropertyPage({ user }) {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [score, setScore] = useState(0);
  const [inFavorite, setInFavorite] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    propertiesApi.get(id).then((r) => setProperty(r.data));
  }, [id]);

  const handleRate = async (s) => {
    setScore(s);
    await ratingsApi.rate({ property_id: Number(id), score: s });
    setMessage("Оценка сохранена!");
    setTimeout(() => setMessage(""), 2000);
  };

  const toggleFavorite = async () => {
    if (inFavorite) {
      await favoritesApi.remove(Number(id));
      setInFavorite(false);
    } else {
      await favoritesApi.add(Number(id));
      setInFavorite(true);
    }
  };

  if (!property) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
      <div className="spinner" />
    </div>
  );

  const pricePerM = Math.round(property.price / property.area);
  const specs = [
    { label: "Тип", value: TYPE_LABELS[property.type] ?? property.type },
    { label: "Тип сделки", value: DEAL_LABELS[property.deal_type] ?? "Продажа" },
    { label: "Площадь", value: `${property.area} м²` },
    property.type !== "house" && property.type !== "commercial" && { label: "Комнат", value: property.rooms },
    property.floor != null && property.total_floors != null && {
      label: "Этаж",
      value: `${property.floor} из ${property.total_floors}`,
    },
    property.type === "house" && property.total_floors != null && { label: "Этажей в доме", value: property.total_floors },
    property.year_built != null && { label: "Год постройки", value: property.year_built },
    property.renovation && { label: "Ремонт", value: RENOVATION_LABELS[property.renovation] ?? property.renovation },
    { label: "Адрес", value: property.address },
  ].filter(Boolean);

  return (
    <div style={S.page}>
      {/* Hero photos */}
      <div style={S.heroWrap}>
        <PhotoCarousel photos={property.photos} alt={property.title} />
        <div style={S.heroOverlay} />
        <div style={S.heroContent}>
          <Link to="/" style={S.back}>← Все объекты</Link>
          <div style={S.heroBadges}>
            <span style={S.heroType}>{TYPE_LABELS[property.type] ?? property.type}</span>
            <span style={{ ...S.heroType, background: "rgba(255,255,255,.2)" }}>
              {DEAL_LABELS[property.deal_type] ?? "Продажа"}
            </span>
          </div>
          <h1 style={S.heroTitle}>{property.title}</h1>
          <p style={S.heroAddr}>📍 {property.address}</p>
        </div>
      </div>

      <div style={S.body}>
        {/* Left column */}
        <div style={S.main}>
          {/* Price + actions */}
          <div style={S.priceCard}>
            <div>
              <div style={S.price}>{property.price.toLocaleString("ru-RU")} ₽</div>
              <div style={S.pricePerM}>
                {pricePerM.toLocaleString("ru-RU")} ₽/м²
              </div>
            </div>
            <div style={S.actions}>
              {user && (
                <button
                  onClick={toggleFavorite}
                  style={{ ...S.favBtn, ...(inFavorite ? S.favBtnActive : {}) }}
                >
                  {inFavorite ? "❤️ В избранном" : "🤍 В избранное"}
                </button>
              )}
              <ShareButton title={property.title} />
            </div>
          </div>

          {/* Characteristics */}
          <div style={S.section}>
            <h3 style={S.sectionTitle}>Характеристики</h3>
            <div style={S.specs}>
              {specs.map(({ label, value }) => (
                <div key={label} style={S.spec}>
                  <span style={S.specLabel}>{label}</span>
                  <span style={S.specValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div style={S.section}>
              <h3 style={S.sectionTitle}>Описание</h3>
              <p style={S.desc}>{property.description}</p>
            </div>
          )}

          {/* Contacts */}
          {(property.seller_name || property.seller_phone) && (
            <div style={S.contactCard}>
              <div style={S.contactLeft}>
                <div style={S.avatar}>
                  {(property.seller_name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={S.contactName}>{property.seller_name || "Продавец"}</div>
                  <div style={S.contactRole}>Собственник</div>
                </div>
              </div>
              {property.seller_phone && (
                <a href={`tel:${property.seller_phone.replace(/[^+\d]/g, "")}`} style={S.phoneBtn}>
                  📞 {property.seller_phone}
                </a>
              )}
            </div>
          )}

          {/* Mortgage calculator (only for sale) */}
          {property.deal_type === "sale" && (
            <MortgageCalculator price={property.price} />
          )}

          {/* Rating */}
          {user && (
            <div style={S.section}>
              <h3 style={S.sectionTitle}>Ваша оценка</h3>
              <div style={S.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => handleRate(s)} style={S.star}>
                    <span style={{ fontSize: 32, color: s <= score ? "#F59E0B" : "#E2E8F0", transition: "color .15s" }}>★</span>
                  </button>
                ))}
                {message && <span style={S.msg}>✓ {message}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Map sidebar */}
        <div style={S.sidebar}>
          <div style={S.mapCard}>
            <h3 style={S.sectionTitle}>На карте</h3>
            <MapView properties={[property]} center={[property.latitude, property.longitude]} />
          </div>
        </div>
      </div>

      {/* Similar properties */}
      <SimilarProperties propertyId={Number(id)} />
    </div>
  );
}

const S = {
  page: { maxWidth: 1280, margin: "0 auto", padding: "0 0 48px" },
  heroWrap: { position: "relative", height: 440, overflow: "hidden" },
  heroOverlay: {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: "linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 60%)",
  },
  heroContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "32px 40px", color: "#fff", pointerEvents: "none",
  },
  back: {
    display: "inline-block", marginBottom: 16,
    color: "rgba(255,255,255,.85)", fontSize: 14, fontWeight: 500,
    pointerEvents: "auto",
  },
  heroBadges: { display: "flex", gap: 8, marginBottom: 10 },
  heroType: {
    display: "inline-block", background: "#2563EB",
    padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  heroTitle: { fontSize: 34, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" },
  heroAddr: { fontSize: 16, color: "rgba(255,255,255,.85)" },

  body: {
    display: "grid", gridTemplateColumns: "1fr 380px", gap: 28,
    padding: "32px 40px 0",
  },
  main: { display: "flex", flexDirection: "column", gap: 24 },

  priceCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 12,
  },
  price: { fontSize: 32, fontWeight: 800, color: "#0F172A", letterSpacing: "-1px" },
  pricePerM: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
  actions: { display: "flex", gap: 10, alignItems: "center" },
  favBtn: {
    padding: "12px 22px", borderRadius: 12, fontWeight: 700, fontSize: 15,
    border: "2px solid #E2E8F0", background: "#fff", color: "#64748B", cursor: "pointer",
    transition: "all .2s", fontFamily: "inherit",
  },
  favBtnActive: { background: "#FEF2F2", borderColor: "#FECACA", color: "#EF4444" },

  section: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 16 },
  specs: { display: "flex", flexDirection: "column", gap: 12 },
  spec: {
    display: "flex", justifyContent: "space-between",
    paddingBottom: 12, borderBottom: "1px solid #F1F5F9",
  },
  specLabel: { color: "#64748B", fontSize: 15 },
  specValue: { fontWeight: 600, fontSize: 15, color: "#1E293B", textAlign: "right" },
  desc: { fontSize: 15, lineHeight: 1.8, color: "#475569" },

  contactCard: {
    background: "linear-gradient(135deg, #FFFFFF, #F8FAFC)",
    borderRadius: 16, padding: "20px 24px",
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 16, flexWrap: "wrap",
  },
  contactLeft: { display: "flex", alignItems: "center", gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: "50%",
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", fontWeight: 800, fontSize: 22,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  contactName: { fontSize: 17, fontWeight: 700, color: "#0F172A" },
  contactRole: { fontSize: 13, color: "#94A3B8" },
  phoneBtn: {
    padding: "12px 22px", borderRadius: 12,
    background: "linear-gradient(135deg, #16A34A, #15803D)",
    color: "#fff", fontWeight: 700, fontSize: 15,
    textDecoration: "none",
  },

  stars: { display: "flex", alignItems: "center", gap: 4 },
  star: { background: "none", border: "none", cursor: "pointer", padding: 2 },
  msg: { fontSize: 14, color: "#10B981", fontWeight: 600, marginLeft: 12 },

  sidebar: {},
  mapCard: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 2px 12px rgba(0,0,0,.08)", position: "sticky", top: 88,
  },
};
