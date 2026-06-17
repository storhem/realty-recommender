import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { propertiesApi, uploadsApi } from "../services/api";
import { useLocationFilter } from "../hooks/useLocationFilter";
import MapPicker from "../components/MapPicker";

const TYPES = [
  { value: "apartment", label: "Квартира" },
  { value: "house", label: "Дом" },
  { value: "studio", label: "Студия" },
  { value: "room", label: "Комната" },
  { value: "commercial", label: "Коммерческая" },
];
const DEAL_TYPES = [
  { value: "sale", label: "Продажа" },
  { value: "rent", label: "Аренда" },
];
const RENOVATIONS = [
  { value: "", label: "Не указан" },
  { value: "none", label: "Без ремонта" },
  { value: "cosmetic", label: "Косметический" },
  { value: "euro", label: "Евроремонт" },
  { value: "designer", label: "Дизайнерский" },
];

const INITIAL = {
  title: "", type: "apartment", deal_type: "sale",
  price: "", area: "", rooms: "1",
  address: "", description: "",
  floor: "", total_floors: "", year_built: "", renovation: "",
  seller_name: "", seller_phone: "",
};

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { city } = useLocationFilter();
  const [f, setF] = useState(INITIAL);
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState(null); // [lat, lon]
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const onPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const file of files) {
        const { data } = await uploadsApi.photo(file);
        urls.push(data.url);
      }
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      setError("Не удалось загрузить фото (допустимы jpg/png/webp до 5 МБ).");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removePhoto = (url) => setPhotos((prev) => prev.filter((u) => u !== url));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!f.title.trim()) { setError("Укажите заголовок объявления"); return; }
    if (!(Number(f.price) > 0)) { setError("Укажите цену больше нуля"); return; }
    if (!(Number(f.area) > 0)) { setError("Укажите площадь больше нуля"); return; }
    if (!f.address.trim()) { setError("Укажите адрес"); return; }
    if (!coords) { setError("Отметьте расположение объекта на карте"); return; }

    const c = coords;
    setSubmitting(true);
    try {
      const payload = {
        title: f.title.trim(),
        type: f.type,
        deal_type: f.deal_type,
        price: Number(f.price),
        area: Number(f.area),
        rooms: Number(f.rooms || 0),
        address: f.address.trim(),
        description: f.description.trim() || null,
        photos,
        latitude: c[0],
        longitude: c[1],
        floor: f.floor ? Number(f.floor) : null,
        total_floors: f.total_floors ? Number(f.total_floors) : null,
        year_built: f.year_built ? Number(f.year_built) : null,
        renovation: f.renovation || null,
        seller_name: f.seller_name.trim() || null,
        seller_phone: f.seller_phone.trim() || null,
      };
      const { data } = await propertiesApi.create(payload);
      navigate(`/properties/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Не удалось сохранить объявление.");
      setSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Разместить объявление</h1>
      <p style={S.sub}>Заполните данные об объекте. Адрес впишите текстом, а расположение
        отметьте кликом по карте — туда встанет метка (её можно перетащить).</p>

      <form onSubmit={submit} style={S.form}>
        <label style={S.label}>Заголовок *
          <input style={S.input} value={f.title} onChange={set("title")}
            placeholder="2-комн. квартира в центре" />
        </label>

        <div style={S.row}>
          <label style={S.label}>Тип объекта
            <select style={S.input} value={f.type} onChange={set("type")}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label style={S.label}>Тип сделки
            <select style={S.input} value={f.deal_type} onChange={set("deal_type")}>
              {DEAL_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
        </div>

        <div style={S.row}>
          <label style={S.label}>Цена, ₽ *
            <input style={S.input} type="number" min="0" value={f.price} onChange={set("price")} />
          </label>
          <label style={S.label}>Площадь, м² *
            <input style={S.input} type="number" min="0" step="0.1" value={f.area} onChange={set("area")} />
          </label>
          <label style={S.label}>Комнат
            <input style={S.input} type="number" min="0" value={f.rooms} onChange={set("rooms")} />
          </label>
        </div>

        <label style={S.label}>Адрес *
          <input style={S.input} value={f.address} onChange={set("address")}
            placeholder="Москва, ул. Тверская, 1" />
        </label>

        <div style={S.label}>
          <span>Расположение на карте * <span style={S.hint}>— кликните по карте, чтобы поставить метку</span></span>
          <MapPicker center={[city.lat, city.lon]} value={coords} onChange={setCoords} />
          {coords ? (
            <div style={S.geoOk}>✓ Метка установлена <span style={S.coords}>({coords[0]}, {coords[1]})</span></div>
          ) : (
            <div style={S.hint}>Точка не выбрана</div>
          )}
        </div>

        <label style={S.label}>Описание
          <textarea style={{ ...S.input, minHeight: 90, resize: "vertical" }}
            value={f.description} onChange={set("description")}
            placeholder="Состояние, инфраструктура, особенности…" />
        </label>

        <div style={S.row}>
          <label style={S.label}>Этаж
            <input style={S.input} type="number" min="0" value={f.floor} onChange={set("floor")} />
          </label>
          <label style={S.label}>Этажей в доме
            <input style={S.input} type="number" min="0" value={f.total_floors} onChange={set("total_floors")} />
          </label>
          <label style={S.label}>Год постройки
            <input style={S.input} type="number" min="1800" max="2100" value={f.year_built} onChange={set("year_built")} />
          </label>
          <label style={S.label}>Ремонт
            <select style={S.input} value={f.renovation} onChange={set("renovation")}>
              {RENOVATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
        </div>

        <div style={S.row}>
          <label style={S.label}>Имя продавца
            <input style={S.input} value={f.seller_name} onChange={set("seller_name")} />
          </label>
          <label style={S.label}>Телефон продавца
            <input style={S.input} value={f.seller_phone} onChange={set("seller_phone")}
              placeholder="+7 (4872) 00-00-00" />
          </label>
        </div>

        <label style={S.label}>Фотографии
          <input type="file" accept="image/*" multiple onChange={onPhotos} disabled={uploading} />
        </label>
        {uploading && <div style={S.note}>Загрузка фото…</div>}
        {photos.length > 0 && (
          <div style={S.thumbs}>
            {photos.map((url) => (
              <div key={url} style={S.thumbWrap}>
                <img src={url} alt="" style={S.thumb} />
                <button type="button" style={S.thumbX} onClick={() => removePhoto(url)}>×</button>
              </div>
            ))}
          </div>
        )}

        {error && <div style={S.error}>{error}</div>}

        <div style={S.actions}>
          <button type="submit" style={S.submit} disabled={submitting || uploading}>
            {submitting ? "Публикация…" : "Опубликовать"}
          </button>
          <button type="button" style={S.cancel} onClick={() => navigate("/")}>Отмена</button>
        </div>
      </form>
    </div>
  );
}

const S = {
  page: { maxWidth: 760, margin: "0 auto", padding: "32px 24px 64px" },
  h1: { fontSize: 28, fontWeight: 800, color: "#0F172A", marginBottom: 6 },
  sub: { color: "#64748B", fontSize: 15, marginBottom: 24 },
  form: {
    background: "#fff", borderRadius: 16, padding: "28px 28px",
    boxShadow: "0 2px 12px rgba(0,0,0,.08)", display: "flex", flexDirection: "column", gap: 16,
  },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  label: {
    display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 120,
    fontSize: 13, fontWeight: 600, color: "#475569",
  },
  input: {
    border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px",
    fontSize: 14, fontFamily: "inherit", color: "#0F172A", outline: "none", width: "100%",
    boxSizing: "border-box",
  },
  geoOk: { color: "#16A34A", fontSize: 13, fontWeight: 600, marginTop: 8 },
  coords: { color: "#94A3B8", fontWeight: 400 },
  hint: { color: "#94A3B8", fontSize: 12, fontWeight: 400 },
  note: { color: "#64748B", fontSize: 13 },
  thumbs: { display: "flex", gap: 10, flexWrap: "wrap" },
  thumbWrap: { position: "relative", width: 96, height: 96 },
  thumb: { width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #E2E8F0" },
  thumbX: {
    position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%",
    border: "none", background: "#0F172A", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1,
  },
  error: {
    background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA",
    borderRadius: 8, padding: "10px 14px", fontSize: 14,
  },
  actions: { display: "flex", gap: 12, marginTop: 8 },
  submit: {
    background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "#fff", border: "none",
    borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer",
    fontFamily: "inherit",
  },
  cancel: {
    background: "transparent", color: "#64748B", border: "1px solid #E2E8F0",
    borderRadius: 10, padding: "12px 22px", fontWeight: 600, fontSize: 15, cursor: "pointer",
    fontFamily: "inherit",
  },
};
