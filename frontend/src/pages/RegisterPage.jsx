import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../services/api";

export default function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      const { data } = await authApi.login({ email: form.email, password: form.password });
      onLogin(data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.leftContent}>
          <div style={S.brand}>🏠 ДомПодбор</div>
          <h2 style={S.leftTitle}>Начните искать идеальное жильё</h2>
          <p style={S.leftSub}>Создайте аккаунт и получите доступ к персональным рекомендациям и сохранению избранного</p>
          <div style={S.steps}>
            {[
              { n: "1", t: "Зарегистрируйтесь", s: "Создайте бесплатный аккаунт" },
              { n: "2", t: "Просматривайте объекты", s: "Оценивайте и сохраняйте в избранное" },
              { n: "3", t: "Получайте рекомендации", s: "Система подберёт подходящие варианты" },
            ].map(({ n, t, s }) => (
              <div key={n} style={S.step}>
                <div style={S.stepNum}>{n}</div>
                <div>
                  <div style={S.stepTitle}>{t}</div>
                  <div style={S.stepSub}>{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.right}>
        <form onSubmit={handleSubmit} style={S.form}>
          <h2 style={S.formTitle}>Создать аккаунт</h2>
          <p style={S.formSub}>Это займёт меньше минуты</p>

          {error && <div style={S.error}>⚠️ {error}</div>}

          <label style={S.label}>Ваше имя</label>
          <input style={S.input} placeholder="Иван Иванов"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label style={S.label}>Email</label>
          <input style={S.input} placeholder="example@mail.ru" type="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label style={S.label}>Пароль</label>
          <input style={S.input} placeholder="Минимум 8 символов" type="password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          <button style={{ ...S.btn, opacity: loading ? .7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Регистрация..." : "Создать аккаунт"}
          </button>

          <p style={S.switchText}>
            Уже есть аккаунт? <Link to="/login" style={S.switchLink}>Войти</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const S = {
  page: { display: "flex", minHeight: "calc(100vh - 64px)" },
  left: {
    flex: 1, background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 48, color: "#fff",
  },
  leftContent: { maxWidth: 420 },
  brand: { fontSize: 22, fontWeight: 800, marginBottom: 32 },
  leftTitle: { fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.5px" },
  leftSub: { fontSize: 16, color: "rgba(255,255,255,.75)", lineHeight: 1.7, marginBottom: 36 },
  steps: { display: "flex", flexDirection: "column", gap: 20 },
  step: { display: "flex", alignItems: "flex-start", gap: 16 },
  stepNum: {
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  stepTitle: { fontWeight: 600, fontSize: 15, marginBottom: 2 },
  stepSub: { fontSize: 13, color: "rgba(255,255,255,.7)" },
  right: {
    width: 480, background: "#fff", display: "flex",
    alignItems: "center", justifyContent: "center", padding: "48px 56px",
  },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 14 },
  formTitle: { fontSize: 28, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" },
  formSub: { fontSize: 15, color: "#64748B", marginBottom: 8 },
  error: {
    background: "#FEF2F2", border: "1px solid #FECACA",
    color: "#DC2626", padding: "10px 14px", borderRadius: 8, fontSize: 14,
  },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #E2E8F0", fontSize: 15, outline: "none",
    color: "#0F172A",
  },
  btn: {
    marginTop: 8, padding: "13px",
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
    color: "#fff", border: "none", borderRadius: 10,
    fontWeight: 700, fontSize: 16, cursor: "pointer",
  },
  switchText: { textAlign: "center", fontSize: 14, color: "#64748B" },
  switchLink: { color: "#2563EB", fontWeight: 600 },
};
