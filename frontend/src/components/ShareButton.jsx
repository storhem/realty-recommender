import { useState } from "react";

export default function ShareButton({ title, url }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const shareUrl = url ?? window.location.href;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {}
    }
    setOpen(!open);
  };

  const tg  = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  const vk  = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
  const wa  = `https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`;
  const qr  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div style={S.wrap}>
      <button onClick={nativeShare} style={S.btn} title="Поделиться">
        📤 Поделиться
      </button>

      {open && (
        <div style={S.popup}>
          <div style={S.row}>
            <a href={tg} target="_blank" rel="noreferrer" style={S.svc}>Telegram</a>
            <a href={vk} target="_blank" rel="noreferrer" style={S.svc}>ВКонтакте</a>
            <a href={wa} target="_blank" rel="noreferrer" style={S.svc}>WhatsApp</a>
          </div>
          <button onClick={copy} style={S.copy}>
            {copied ? "✓ Скопировано" : "📋 Копировать ссылку"}
          </button>
          <div style={S.qrWrap}>
            <img src={qr} alt="QR-код" style={S.qr} />
            <div style={S.qrCap}>Отсканируйте QR-код, чтобы открыть на телефоне</div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { position: "relative" },
  btn: {
    padding: "12px 22px", borderRadius: 12,
    background: "#F1F5F9", color: "#1E293B",
    border: "2px solid transparent", fontWeight: 700, fontSize: 15,
    cursor: "pointer", fontFamily: "inherit",
  },
  popup: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    width: 280, background: "#fff",
    borderRadius: 14, boxShadow: "0 12px 36px rgba(0,0,0,.18)",
    padding: 14, zIndex: 100,
  },
  row: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 10 },
  svc: {
    textAlign: "center", padding: "10px 6px",
    background: "#F8FAFC", borderRadius: 8,
    fontSize: 12, fontWeight: 600, color: "#1E293B",
    transition: "background .15s",
  },
  copy: {
    width: "100%", padding: "10px",
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", border: "none", borderRadius: 8,
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    fontFamily: "inherit", marginBottom: 14,
  },
  qrWrap: { textAlign: "center", paddingTop: 12, borderTop: "1px solid #F1F5F9" },
  qr: { width: 140, height: 140, borderRadius: 8, background: "#F8FAFC" },
  qrCap: { fontSize: 11, color: "#94A3B8", marginTop: 6 },
};
