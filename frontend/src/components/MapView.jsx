import { useEffect, useRef } from "react";

const YANDEX_API_KEY = "YOUR_YANDEX_MAPS_API_KEY";

function loadYandexMaps() {
  if (window.ymaps) return Promise.resolve(window.ymaps);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
    script.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    document.head.appendChild(script);
  });
}

export default function MapView({ properties, center, onRadiusSearch }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    loadYandexMaps().then((ymaps) => {
      if (mapRef.current) mapRef.current.destroy();

      const map = new ymaps.Map(ref.current, {
        center: center ?? [55.751244, 37.618423],
        zoom: 11,
        controls: ["zoomControl"],
      });
      mapRef.current = map;

      // Метки объектов
      properties?.forEach((p) => {
        const placemark = new ymaps.Placemark(
          [p.latitude, p.longitude],
          { balloonContent: `<b>${p.title}</b><br/>${p.price.toLocaleString("ru-RU")} ₽` },
          { preset: "islands#blueHomeIcon" }
        );
        map.geoObjects.add(placemark);
      });

      // Круг радиуса поиска
      if (onRadiusSearch) {
        const circle = new ymaps.Circle([center ?? [55.751244, 37.618423], 5000], {}, { fillOpacity: 0.1, strokeWidth: 2 });
        map.geoObjects.add(circle);

        map.events.add("click", (e) => {
          const coords = e.get("coords");
          circle.geometry.setCoordinates([coords, 5000]);
          onRadiusSearch({ lat: coords[0], lon: coords[1], radius: 5000 });
        });
      }
    });

    return () => mapRef.current?.destroy();
  }, [properties]);

  return <div ref={ref} style={{ width: "100%", height: 420, borderRadius: 8 }} />;
}
