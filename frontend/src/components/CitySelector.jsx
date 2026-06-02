import { useState, useRef, useEffect } from "react";
import { CITIES, RADIUS_OPTIONS_KM, useLocationFilter } from "../hooks/useLocationFilter";

export default function CitySelector() {
  const { city, radiusKm, setCity, setRadius } = useLocationFilter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div ref={wrapRef} style={S.wrap}>
      <button onClick={() => setOpen(!open)} style={S.trigger} title="Выбрать город и радиус">
        <span style={S.pin}>📍</span>
        <span style={S.cityName}>{city.name}</span>
        <span style={S.plus}>+{radiusKm} км</span>
        <span style={S.chev}>▾</span>
      </button>

      {open && (
        <div style={S.popover}>
          <div style={S.section}>
            <div style={S.label}>Город</div>
            <input
              autoFocus
              placeholder="Поиск города..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={S.search}
            />
            <div style={S.cityList}>
              {filtered.length === 0 && (
                <div style={S.empty}>Город не найден</div>
              )}
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCity(c.id); setOpen(false); setQuery(""); }}
                  style={{
                    ...S.cityItem,
                    ...(c.id === city.id ? S.cityItemActive : {}),
                  }}
                >
                  <span>{c.name}</span>
                  {c.id === city.id && <span style={S.check}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={S.divider} />

          <div style={S.section}>
            <div style={S.labelRow}>
              <span style={S.label}>Радиус поиска</span>
              <span style={S.radiusValue}>{radiusKm} км</span>
            </div>
            <div style={S.radiusGrid}>
              {RADIUS_OPTIONS_KM.map((km) => (
                <button
                  key={km}
                  onClick={() => setRadius(km)}
                  style={{
                    ...S.radiusBtn,
                    ...(km === radiusKm ? S.radiusBtnActive : {}),
                  }}
                >
                  {km} км
                </button>
              ))}
            </div>
          </div>

          <div style={S.footer}>
            <button onClick={() => setOpen(false)} style={S.apply}>
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { position: "relative", flexShrink: 0 },
  trigger: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    transition: "all .2s",
    fontFamily: "inherit",
  },
  pin: { fontSize: 14 },
  cityName: { fontWeight: 600 },
  plus: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  chev: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginLeft: 2 },

  popover: {
    position: "absolute", top: "calc(100% + 8px)", left: 0,
    width: 340, background: "#fff",
    borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
    padding: "8px 0", zIndex: 200,
    color: "#0F172A",
  },
  section: { padding: "12px 18px" },
  label: { fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.4 },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  radiusValue: { fontSize: 13, fontWeight: 700, color: "#2563EB" },

  search: {
    width: "100%", marginTop: 8,
    padding: "10px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: 8, fontSize: 14,
    outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  },
  cityList: {
    marginTop: 8, maxHeight: 220, overflowY: "auto",
    display: "flex", flexDirection: "column", gap: 2,
  },
  cityItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px",
    background: "transparent", border: "none",
    borderRadius: 8, fontSize: 14, color: "#1E293B",
    cursor: "pointer", textAlign: "left",
    fontFamily: "inherit",
    transition: "background .15s",
  },
  cityItemActive: { background: "#EFF6FF", color: "#2563EB", fontWeight: 600 },
  check: { color: "#2563EB", fontWeight: 700 },
  empty: { padding: "12px", fontSize: 13, color: "#94A3B8", textAlign: "center" },

  divider: { height: 1, background: "#F1F5F9", margin: "4px 0" },

  radiusGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8, marginTop: 4,
  },
  radiusBtn: {
    padding: "10px 4px",
    background: "#F8FAFC", border: "1px solid #E2E8F0",
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    color: "#475569", cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
  },
  radiusBtnActive: {
    background: "#2563EB", borderColor: "#2563EB",
    color: "#fff", fontWeight: 700,
  },

  footer: { padding: "10px 18px 14px", borderTop: "1px solid #F1F5F9" },
  apply: {
    width: "100%",
    padding: "10px",
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", fontWeight: 700, fontSize: 14,
    border: "none", borderRadius: 10, cursor: "pointer",
    fontFamily: "inherit",
  },
};
