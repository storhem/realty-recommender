import { useEffect, useRef } from "react";

const YANDEX_API_KEY = "611ec252-06fe-4112-81ff-2ec666445fd1";

function loadYandexMaps() {
  if (window.ymaps) return Promise.resolve(window.ymaps);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
    script.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    document.head.appendChild(script);
  });
}

// Карта для выбора точки: клик ставит перетаскиваемую метку,
// координаты возвращаются через onChange как [lat, lon].
export default function MapPicker({ center, value, onChange }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let destroyed = false;

    loadYandexMaps().then((ymaps) => {
      if (destroyed || mapRef.current) return;

      const map = new ymaps.Map(ref.current, {
        center: value ?? center,
        zoom: 13,
        controls: ["zoomControl", "geolocationControl"],
      });
      mapRef.current = map;

      const emit = (coords) => {
        const c = [Number(coords[0].toFixed(6)), Number(coords[1].toFixed(6))];
        onChangeRef.current(c);
      };

      const place = (coords) => {
        if (!markRef.current) {
          markRef.current = new ymaps.Placemark(
            coords, {}, { draggable: true, preset: "islands#redHomeIcon" }
          );
          markRef.current.events.add("dragend", () =>
            emit(markRef.current.geometry.getCoordinates())
          );
          map.geoObjects.add(markRef.current);
        } else {
          markRef.current.geometry.setCoordinates(coords);
        }
      };

      if (value) place(value);

      map.events.add("click", (e) => {
        const coords = e.get("coords");
        place(coords);
        emit(coords);
      });
    });

    return () => {
      destroyed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      markRef.current = null;
    };
    // Инициализируем карту один раз; центр/значение задаются при монтировании.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} style={{ width: "100%", height: 360, borderRadius: 8, overflow: "hidden" }} />;
}
