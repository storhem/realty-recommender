export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = [];
  const push = (p) => pages.push(p);
  const window_ = 1;

  push(1);
  if (page - window_ > 2) push("…");
  for (let p = Math.max(2, page - window_); p <= Math.min(totalPages - 1, page + window_); p++) {
    push(p);
  }
  if (page + window_ < totalPages - 1) push("…");
  if (totalPages > 1) push(totalPages);

  return (
    <div style={S.wrap}>
      <button
        style={{ ...S.btn, ...(page === 1 ? S.btnDisabled : {}) }}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >‹ Назад</button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={S.ellipsis}>…</span>
        ) : (
          <button
            key={p}
            style={{ ...S.btn, ...(p === page ? S.btnActive : {}) }}
            onClick={() => onChange(p)}
          >{p}</button>
        )
      )}

      <button
        style={{ ...S.btn, ...(page >= totalPages ? S.btnDisabled : {}) }}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >Далее ›</button>
    </div>
  );
}

const S = {
  wrap: {
    display: "flex", justifyContent: "center", alignItems: "center", gap: 6,
    padding: "32px 0 8px",
  },
  btn: {
    minWidth: 38, height: 38,
    padding: "0 12px",
    background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 8, fontSize: 14, fontWeight: 600,
    color: "#1E293B", cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
  },
  btnActive: { background: "#2563EB", borderColor: "#2563EB", color: "#fff" },
  btnDisabled: { opacity: .4, cursor: "not-allowed" },
  ellipsis: { color: "#94A3B8", padding: "0 6px" },
};
