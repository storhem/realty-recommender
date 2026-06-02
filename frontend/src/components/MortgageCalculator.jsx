import { useMemo, useState } from "react";

export default function MortgageCalculator({ price }) {
  const [downPct, setDownPct] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(15);

  const { downPayment, loan, monthly, overpay, totalPaid } = useMemo(() => {
    const dp = Math.round(price * downPct / 100);
    const lo = price - dp;
    const months = years * 12;
    const r = rate / 100 / 12;
    const m = r === 0 ? lo / months : (lo * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const total = m * months;
    return {
      downPayment: dp,
      loan: lo,
      monthly: Math.round(m),
      totalPaid: Math.round(total),
      overpay: Math.round(total - lo),
    };
  }, [price, downPct, years, rate]);

  const fmt = (n) => n.toLocaleString("ru-RU");

  return (
    <div style={S.wrap}>
      <h3 style={S.title}>💰 Калькулятор ипотеки</h3>

      <div style={S.controls}>
        <Control label={`Первый взнос — ${downPct}% · ${fmt(downPayment)} ₽`}
          min={10} max={90} step={5} value={downPct} onChange={setDownPct} />
        <Control label={`Срок — ${years} лет`}
          min={1} max={30} step={1} value={years} onChange={setYears} />
        <Control label={`Ставка — ${rate}%`}
          min={3} max={25} step={0.5} value={rate} onChange={setRate} />
      </div>

      <div style={S.result}>
        <div style={S.monthlyRow}>
          <span style={S.monthlyLabel}>Ежемесячный платёж</span>
          <span style={S.monthly}>{fmt(monthly)} ₽</span>
        </div>
        <div style={S.row}><span>Сумма кредита</span><b>{fmt(loan)} ₽</b></div>
        <div style={S.row}><span>Переплата</span><b>{fmt(overpay)} ₽</b></div>
        <div style={S.row}><span>Всего выплат</span><b>{fmt(totalPaid + downPayment)} ₽</b></div>
      </div>
    </div>
  );
}

function Control({ label, min, max, step, value, onChange }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 13, color: "#64748B", marginBottom: 6, fontWeight: 500 }}>
        {label}
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#2563EB" }}
      />
    </label>
  );
}

const S = {
  wrap: {
    background: "#fff", borderRadius: 16, padding: "24px 28px",
    boxShadow: "0 2px 12px rgba(0,0,0,.08)",
  },
  title: { fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 18 },
  controls: { marginBottom: 18 },
  result: { borderTop: "1px solid #F1F5F9", paddingTop: 16 },
  monthlyRow: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
    padding: "16px 18px", borderRadius: 12, marginBottom: 12,
  },
  monthlyLabel: { fontSize: 14, color: "#1E40AF", fontWeight: 600 },
  monthly: { fontSize: 22, fontWeight: 800, color: "#1D4ED8", letterSpacing: "-.5px" },
  row: {
    display: "flex", justifyContent: "space-between",
    fontSize: 14, color: "#475569", padding: "8px 0",
  },
};
