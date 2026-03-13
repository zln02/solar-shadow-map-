import { useEffect, useRef } from "react";
import { targetAreaGeoPolygon } from "../utils/publicData";

export function KakaoMapPanel({ kakaoReady, location, buildings, targetArea }) {
  const mapRef = useRef(null);
  const instanceRef = useRef({ map: null, overlays: [] });

  useEffect(() => {
    if (!kakaoReady || !mapRef.current) return undefined;
    const currentInstance = instanceRef.current;

    if (!currentInstance.map) {
      currentInstance.map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(location.lat, location.lng),
        level: 3,
      });
    }

    const map = currentInstance.map;
    const overlays = currentInstance.overlays;
    map.setCenter(new window.kakao.maps.LatLng(location.lat, location.lng));

    overlays.forEach((overlay) => overlay.setMap(null));
    currentInstance.overlays = [];

    const marker = new window.kakao.maps.Marker({
      map,
      position: new window.kakao.maps.LatLng(location.lat, location.lng),
    });
    currentInstance.overlays.push(marker);

    const lotPolygon = new window.kakao.maps.Polygon({
      map,
      path: targetAreaGeoPolygon(targetArea, location.lat, location.lng).map(
        (point) => new window.kakao.maps.LatLng(point.lat, point.lng),
      ),
      strokeWeight: 2,
      strokeColor: "#f59e0b",
      strokeOpacity: 0.9,
      fillColor: "rgba(245, 158, 11, 0.18)",
      fillOpacity: 0.85,
    });
    currentInstance.overlays.push(lotPolygon);

    buildings
      .filter((building) => building.geoPolygon?.length)
      .slice(0, 60)
      .forEach((building) => {
        const polygon = new window.kakao.maps.Polygon({
          map,
          path: building.geoPolygon.map(
            (point) => new window.kakao.maps.LatLng(point.lat, point.lng),
          ),
          strokeWeight: 1,
          strokeColor: "#5eead4",
          strokeOpacity: 0.8,
          fillColor: building.source === "public_data" ? "rgba(94, 234, 212, 0.18)" : "rgba(245, 158, 11, 0.18)",
          fillOpacity: 0.72,
        });
        currentInstance.overlays.push(polygon);
      });

    const activeOverlays = [...currentInstance.overlays];

    return () => {
      activeOverlays.forEach((overlay) => overlay.setMap(null));
      currentInstance.overlays = [];
    };
  }, [buildings, kakaoReady, location, targetArea]);

  if (!kakaoReady) {
    return (
      <div className="map-fallback">
        <h3>지도 연동 대기 중</h3>
        <p>
          `VITE_KAKAO_API_KEY`를 설정하면 주소 검색과 실제 지도 위 건물 오버레이가 활성화됩니다.
        </p>
      </div>
    );
  }

  return <div ref={mapRef} className="map-panel" />;
}
