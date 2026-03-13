export const CITY_PRESETS = [
  { name: "서울", address: "서울특별시청", lat: 37.5665, lng: 126.978, regionKey: "서울" },
  { name: "부산", address: "부산광역시청", lat: 35.1796, lng: 129.0756, regionKey: "부산" },
  { name: "제주", address: "제주특별자치도청", lat: 33.4996, lng: 126.5312, regionKey: "제주" },
  { name: "도쿄", address: "Tokyo Station", lat: 35.6812, lng: 139.7671, regionKey: "도쿄" },
  { name: "뉴욕", address: "Times Square, New York", lat: 40.758, lng: -73.9855, regionKey: "뉴욕" },
];

export const DEFAULT_TARGET_AREA = {
  x: 0,
  y: 0,
  width: 24,
  depth: 24,
};

export const DEFAULT_MANUAL_BUILDINGS = [
  {
    id: "manual-seed-1",
    name: "신축 가정 건물",
    x: -34,
    y: 6,
    width: 12,
    depth: 18,
    height: 21,
    floors: 6,
    source: "manual",
    color: "#f59e0b",
  },
];
