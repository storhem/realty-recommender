import { useEffect, useRef } from "react";
import { useLocationFilter } from "../hooks/useLocationFilter";

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

function zoomForRadiusKm(km) {
  if (km <= 5)   return 12;
  if (km <= 10)  return 11;
  if (km <= 20)  return 10;
  if (km <= 50)  return 9;
  if (km <= 100) return 8;
  return 7;
}

export default function MapView({ properties, center, onRadiusSearch }) {
  const { city, radiusKm } = useLocationFilter();
  const ref = useRef(null);
  const mapRef = useRef(null);

  const mapCenter = center ?? [city.lat, city.lon];
  const radiusM = radiusKm * 1000;

  useEffect(() => {
    loadYandexMaps().then((ymaps) => {
      if (mapRef.current) mapRef.current.destroy();

      const map = new ymaps.Map(ref.current, {
        center: mapCenter,
        zoom: zoomForRadiusKm(radiusKm),
        controls: ["zoomControl"],
      });
      mapRef.current = map;

      // Кластеризация меток
      if (properties && properties.length > 0) {
        const clusterer = new ymaps.Clusterer({
          preset: "islands#blueClusterIcons",
          groupByCoordinates: false,
          clusterDisableClickZoom: false,
          clusterHideIconOnBalloonOpen: false,
          geoObjectHideIconOnBalloonOpen: false,
          clusterBalloonContentLayout: "cluster#balloonCarousel",
          clusterBalloonItemContentLayout: ymaps.templateLayoutFactory.createClass(
            "<div style='padding:6px 8px;'><b>$[properties.title]</b><br/>$[properties.priceText]</div>"
          ),
        });

        const placemarks = properties.map((p) => new ymaps.Placemark(
          [p.latitude, p.longitude],
          {
            title: p.title,
            priceText: `${p.price.toLocaleString("ru-RU")} ₽`,
            balloonContent:
              `<b>${p.title}</b><br/>${p.price.toLocaleString("ru-RU")} ₽<br/>` +
              `<a href="/properties/${p.id}">Подробнее →</a>`,
            hintContent: `${p.price.toLocaleString("ru-RU")} ₽`,
          },
          { preset: "islands#blueHomeIcon" }
        ));

        clusterer.add(placemarks);
        map.geoObjects.add(clusterer);
      }

      // Круг радиуса поиска
      if (onRadiusSearch) {
        const circle = new ymaps.Circle(
          [mapCenter, radiusM], {},
          { fillOpacity: 0.08, strokeColor: "#2563EB", strokeWidth: 2 }
        );
        map.geoObjects.add(circle);

        map.events.add("click", (e) => {
          const coords = e.get("coords");
          circle.geometry.setCoordinates([coords, radiusM]);
          onRadiusSearch({ lat: coords[0], lon: coords[1], radius: radiusM });
        });
      }
    });

    return () => mapRef.current?.destroy();
  }, [properties, mapCenter[0], mapCenter[1], radiusKm]);

  return <div ref={ref} style={{ width: "100%", height: 420, borderRadius: 8 }} />;
}
