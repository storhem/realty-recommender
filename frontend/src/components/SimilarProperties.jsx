import { useEffect, useState } from "react";
import { propertiesApi } from "../services/api";
import PropertyCard from "./PropertyCard";

export default function SimilarProperties({ propertyId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    propertiesApi.similar(propertyId, 6)
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [propertyId]);

  if (loading) return null;
  if (!items.length) return null;

  return (
    <div style={S.wrap}>
      <h3 style={S.title}>Похожие объекты</h3>
      <div style={S.grid}>
        {items.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </div>
  );
}

const S = {
  wrap: { maxWidth: 1280, margin: "32px auto 0", padding: "0 40px" },
  title: { fontSize: 24, fontWeight: 700, color: "#0F172A", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
};
