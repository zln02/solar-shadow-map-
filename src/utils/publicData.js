import { boundingBox, localMetersFromLatLng, metersPerLng, polygonCentroid } from "./geometry";

function getFeatureCoordinates(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return [];

  if (geometry.type === "Polygon") return geometry.coordinates?.[0] ?? [];
  if (geometry.type === "MultiPolygon") return geometry.coordinates?.[0]?.[0] ?? [];
  return [];
}

function normalizeHeight(properties) {
  const candidate =
    properties?.height ??
    properties?.HEIGHT ??
    properties?.HEIT ??
    properties?.A15 ??
    properties?.hg ??
    properties?.grndFlrCnt * 3.3;

  const numeric = Number(candidate);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return 12;
}

function normalizeName(properties, index) {
  return (
    properties?.buld_nm ||
    properties?.mainPurpsCdNm ||
    properties?.mainPurpsCdNm1 ||
    properties?.label ||
    `주변 건물 ${index + 1}`
  );
}

export async function fetchVworldBuildings({ lat, lng, radius = 200, signal }) {
  const apiKey = import.meta.env.VITE_VWORLD_API_KEY;
  if (!apiKey) {
    return {
      buildings: [],
      message: "VWorld API 키가 없어 수동 시뮬레이션 모드로 동작합니다.",
    };
  }

  const endpoint = new URL("https://api.vworld.kr/req/data");
  endpoint.searchParams.set("service", "data");
  endpoint.searchParams.set("request", "GetFeature");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("size", "80");
  endpoint.searchParams.set("page", "1");
  endpoint.searchParams.set("data", "LT_C_AISBLDG");
  endpoint.searchParams.set("geomFilter", `POINT(${lng} ${lat})`);
  endpoint.searchParams.set("buffer", String(radius));
  endpoint.searchParams.set("crs", "EPSG:4326");
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint.toString(), { signal });
  if (!response.ok) {
    throw new Error(`VWorld API 응답 실패 (${response.status})`);
  }

  const payload = await response.json();
  const features = payload?.response?.result?.featureCollection?.features ?? [];

  const buildings = features
    .map((feature, index) => {
      const coords = getFeatureCoordinates(feature);
      if (coords.length < 3) return null;

      const localPolygon = coords.map(([pointLng, pointLat]) => {
        const local = localMetersFromLatLng(pointLat, pointLng, lat, lng);
        return [local.x, local.y];
      });

      const bbox = boundingBox(localPolygon);
      const center = polygonCentroid(localPolygon);
      const props = feature.properties ?? {};
      const height = normalizeHeight(props);

      return {
        id: `public-${props?.gid ?? index}`,
        name: normalizeName(props, index),
        x: Math.round(center.x * 10) / 10,
        y: Math.round(center.y * 10) / 10,
        width: Math.max(6, Math.round((bbox.maxX - bbox.minX) * 10) / 10),
        depth: Math.max(6, Math.round((bbox.maxY - bbox.minY) * 10) / 10),
        height,
        floors: Math.max(1, Math.round(height / 3.3)),
        source: "public_data",
        geoPolygon: coords.map(([pointLng, pointLat]) => ({ lat: pointLat, lng: pointLng })),
      };
    })
    .filter(Boolean);

  return {
    buildings,
    message:
      buildings.length > 0
        ? `반경 ${radius}m 내 건물 ${buildings.length}개를 불러왔습니다.`
        : "반경 내 건물을 찾지 못해 수동 시뮬레이션 모드로 전환했습니다.",
  };
}

export function targetAreaGeoPolygon(targetArea, originLat, originLng) {
  const halfWidth = targetArea.width / 2;
  const halfDepth = targetArea.depth / 2;
  const corners = [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ];

  return corners.map(([x, y]) => ({
    lat: originLat + y / 111320,
    lng: originLng + x / metersPerLng(originLat),
  }));
}
