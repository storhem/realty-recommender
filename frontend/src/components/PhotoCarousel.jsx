import { useState } from "react";

const PLACEHOLDER = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";

export default function PhotoCarousel({ photos = [], alt = "" }) {
  const items = photos.length ? photos : [PLACEHOLDER];
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <div style={S.wrap}>
      <img
        src={items[index]}
        alt={alt}
        style={S.img}
        onError={(e) => { e.target.src = PLACEHOLDER; }}
      />

      {items.length > 1 && (
        <>
          <button style={{ ...S.arrow, left: 16 }} onClick={prev} aria-label="Предыдущее фото">‹</button>
          <button style={{ ...S.arrow, right: 16 }} onClick={next} aria-label="Следующее фото">›</button>

          <div style={S.counter}>{index + 1} / {items.length}</div>

          <div style={S.dots}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                style={{ ...S.dot, ...(i === index ? S.dotActive : {}) }}
                aria-label={`Фото ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const S = {
  wrap: { position: "relative", width: "100%", height: 440, overflow: "hidden", background: "#0F172A" },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  arrow: {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: 44, height: 44, borderRadius: "50%",
    background: "rgba(15,23,42,.6)", border: "none",
    color: "#fff", fontSize: 28, fontWeight: 700,
    cursor: "pointer", lineHeight: 1,
    transition: "background .15s",
  },
  counter: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(15,23,42,.7)", color: "#fff",
    padding: "6px 14px", borderRadius: 20,
    fontSize: 13, fontWeight: 600,
  },
  dots: {
    position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: 6,
  },
  dot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "rgba(255,255,255,.4)", border: "none",
    cursor: "pointer", padding: 0,
    transition: "all .15s",
  },
  dotActive: { background: "#fff", width: 24, borderRadius: 4 },
};
