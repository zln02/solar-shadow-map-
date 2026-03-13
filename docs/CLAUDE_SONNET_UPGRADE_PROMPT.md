<aside>
🎯

**이 프롬프트를 Claude Sonnet에게 전달하세요.**

Solar Shadow Map(공터 일조권 시뮬레이터)을 포트폴리오용 실서비스 수준으로 전면 업그레이드합니다.

</aside>

---

# 프로젝트 현황

**Solar Shadow Map** — 공터 일조권 시뮬레이터

**GitHub:** https://github.com/zln02/solar-shadow-map-

**스택:** React 19 + Vite / Three.js / Chart.js / Canvas 2D API

**배포:** 미배포 (`npm run dev` 로컬 전용)

### 현재 기능

- 2D 평면도 — 건물 배치 및 그림자를 캔버스로 렌더링, 건물 드래그/추가/삭제/높이 조절
- 3D 뷰 — Three.js 기반 3D 씬, 마우스로 회전·줌
- 일조 그래프 — Chart.js 이중 Y축 차트로 시간대별 일조 면적(%) 및 태양 고도각
- 하루 재생 — 시간 슬라이더 애니메이션으로 그림자 변화 확인
- 도시 선택 — 서울·부산·제주·도쿄·뉴욕 위도 프리셋

### 핵심 알고리즘

- 태양 위치 계산 — 위도·일수(Day of Year) 기반 고도각·방위각 천문 공식
- Convex Hull — Andrew's Monotone Chain으로 그림자 다각형 생성
- Point-in-Polygon — Ray Casting으로 일조 면적 샘플링 계산

### 현재 문제점

1. **실사용 불가** — 실제 주소 검색/지도 연동 없이 수동 건물 배치만 가능
2. **데이터가 가상** — 실제 건물 높이 데이터 연동 없음
3. **분석 결과 활용 불가** — 리포트 내보내기, 공유 기능 없음
4. **배포 안 됨** — 라이브 URL 없음
5. **코드 구조** — 컴포넌트 분리 부족, TypeScript 미사용
6. **UI 촌스러움** — 기본 React 스타일, 프로페셔널하지 않음

---

# PHASE 1 — 프로젝트 구조 & 아키텍처 개선

<aside>
📁

**목표:** 단일 파일 → 모듈화된 프로페셔널 구조로 전환

</aside>

## 1-1. 디렉토리 구조 재설계

```text
solar-shadow-map/
├── public/
│   ├── favicon.svg          # 태양 아이콘
│   └── og-image.png         # SNS 공유용 프리뷰 이미지
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainPanel.tsx
│   │   ├── Map/
│   │   │   ├── KakaoMap.tsx
│   │   │   └── AddressSearch.tsx
│   │   ├── Canvas2D/
│   │   │   ├── ShadowCanvas.tsx
│   │   │   ├── BuildingLayer.tsx
│   │   │   └── ShadowLayer.tsx
│   │   ├── ThreeView/
│   │   │   ├── Scene.tsx
│   │   │   ├── Buildings.tsx
│   │   │   ├── Shadows.tsx
│   │   │   └── SunLight.tsx
│   │   ├── Chart/
│   │   │   ├── SunlightChart.tsx
│   │   │   └── MonthlyHeatmap.tsx
│   │   ├── Controls/
│   │   │   ├── TimeSlider.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── BuildingEditor.tsx
│   │   │   └── CitySelector.tsx
│   │   ├── Analysis/
│   │   │   ├── SunlightAnalysis.tsx
│   │   │   ├── LegalCheck.tsx
│   │   │   ├── SolarPanel.tsx
│   │   │   └── ReportExport.tsx
│   │   └── UI/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Tooltip.tsx
│   ├── hooks/
│   │   ├── useSolarPosition.ts
│   │   ├── useShadowCalculation.ts
│   │   ├── useBuildings.ts
│   │   ├── useAnimation.ts
│   │   └── usePublicData.ts
│   ├── utils/
│   │   ├── solar.ts
│   │   ├── shadow.ts
│   │   ├── geometry.ts
│   │   ├── cities.ts
│   │   └── legal.ts
│   ├── store/
│   │   └── useStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tokens.css
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── solar.test.ts
│   ├── shadow.test.ts
│   └── geometry.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── vercel.json
└── README.md
```

## 1-2. TypeScript 전환

```tsx
// src/types/index.ts
export interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  floors?: number;
  name?: string;
  source: 'manual' | 'public_data';
  color?: string;
}

export interface SunPosition {
  altitude: number;
  azimuth: number;
  isDay: boolean;
}

export interface ShadowPolygon {
  buildingId: string;
  vertices: [number, number][];
  area: number;
}

export interface AnalysisResult {
  date: string;
  location: { lat: number; lng: number; address: string };
  hourlyData: {
    hour: number;
    sunAltitude: number;
    sunAzimuth: number;
    sunlitPercent: number;
  }[];
  totalSunlightHours: number;
  legalCompliance: {
    standard: string;
    required: number;
    actual: number;
    passed: boolean;
  };
  solarPanelEstimate?: {
    areaM2: number;
    annualKwh: number;
    annualSavingsKRW: number;
  };
}

export interface CityPreset {
  name: string;
  nameKo: string;
  lat: number;
  lng: number;
  timezone: string;
}
```

## 1-3. Zustand 상태 관리

```tsx
// src/store/useStore.ts
import { create } from 'zustand';
import type { Building, AnalysisResult } from '../types';

interface AppState {
  latitude: number;
  longitude: number;
  address: string;
  setLocation: (lat: number, lng: number, address: string) => void;

  date: Date;
  hour: number;
  minute: number;
  isPlaying: boolean;
  setDate: (date: Date) => void;
  setTime: (hour: number, minute: number) => void;
  togglePlay: () => void;

  buildings: Building[];
  targetArea: { x: number; y: number; width: number; depth: number };
  addBuilding: (b: Building) => void;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  removeBuilding: (id: string) => void;
  setBuildings: (buildings: Building[]) => void;

  viewMode: '2d' | '3d' | 'split';
  setViewMode: (mode: '2d' | '3d' | 'split') => void;

  analysis: AnalysisResult | null;
  setAnalysis: (result: AnalysisResult) => void;
}

export const useStore = create<AppState>((set) => ({
  latitude: 37.5665,
  longitude: 126.978,
  address: '서울특별시',
  setLocation: (lat, lng, address) => set({ latitude: lat, longitude: lng, address }),

  date: new Date(),
  hour: 12,
  minute: 0,
  isPlaying: false,
  setDate: (date) => set({ date }),
  setTime: (hour, minute) => set({ hour, minute }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  buildings: [],
  targetArea: { x: 0, y: 0, width: 50, depth: 50 },
  addBuilding: (b) => set((s) => ({ buildings: [...s.buildings, b] })),
  updateBuilding: (id, updates) => set((s) => ({
    buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...updates } : b)),
  })),
  removeBuilding: (id) => set((s) => ({ buildings: s.buildings.filter((b) => b.id !== id) })),
  setBuildings: (buildings) => set({ buildings }),

  viewMode: 'split',
  setViewMode: (viewMode) => set({ viewMode }),

  analysis: null,
  setAnalysis: (analysis) => set({ analysis }),
}));
```

---

# PHASE 2 — 카카오맵 + 공공데이터 연동

<aside>
🗺️

**목표:** 주소 검색 → 주변 건물 자동 로딩 → 즉시 시뮬레이션

</aside>

## 2-1. 카카오맵 주소 검색 연동

```tsx
// src/components/Map/AddressSearch.tsx
import { useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';

export default function AddressSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const setLocation = useStore((s) => s.setLocation);

  const search = useCallback(() => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(query, (result: any[], status: any) => {
      if (status === kakao.maps.services.Status.OK) {
        setResults(result);
      }
    });
  }, [query]);

  const selectAddress = (item: any) => {
    const lat = parseFloat(item.y);
    const lng = parseFloat(item.x);
    setLocation(lat, lng, item.address_name);
    setResults([]);
  };

  return null;
}
```

## 2-2. 공공데이터 건물 높이 로딩

```tsx
// src/hooks/usePublicData.ts
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import type { Building } from '../types';

export function usePublicData() {
  const { latitude, longitude, setBuildings } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchBuildings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.vworld.kr/req/data?` +
            `service=data&request=GetFeature&data=LT_C_AISRESC` +
            `&key=${import.meta.env.VITE_VWORLD_API_KEY}` +
            `&geomFilter=POINT(${longitude} ${latitude})` +
            `&buffer=200&size=100` +
            `&crs=EPSG:4326&format=json`,
        );
        const data = await res.json();

        const buildings: Building[] =
          data.response?.result?.featureCollection?.features?.map((f: any, i: number) => {
            const props = f.properties;
            const coords = f.geometry.coordinates[0];
            const center = getCentroid(coords);

            return {
              id: `pub-${i}`,
              x: metersFromCenter(center[0], longitude),
              y: metersFromCenter(center[1], latitude),
              width: estimateWidth(coords),
              depth: estimateDepth(coords),
              height: props.A15 || props.grndFlrCnt * 3.3 || 10,
              floors: props.grndFlrCnt || Math.round((props.A15 || 10) / 3.3),
              name: props.buld_nm || `건물 ${i + 1}`,
              source: 'public_data',
            };
          }) || [];

        setBuildings(buildings);
      } catch (err) {
        setError('건물 데이터를 불러올 수 없습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, [latitude, longitude, setBuildings]);

  return { loading, error };
}
```

## 2-3. 카카오맵에 건물 + 공터 시각화

```tsx
// src/components/Map/KakaoMap.tsx
// 기능:
// 1. 지도 렌더링 + 현재 위치 마커
// 2. 공공데이터 건물을 반투명 폴리곤으로 표시
// 3. 공터 영역을 노란색 사각형으로 표시 (드래그로 지정)
// 4. "신축 건물 추가" 모드 — 지도 클릭으로 수동 건물 추가
// 5. 2D/3D 뷰와 실시간 동기화
```

---

# PHASE 3 — 일조 분석 & 법규 판정

<aside>
⚖️

**목표:** 일조시간 정량 분석 + 한국 일조권 법규 자동 판정 + 태양광 발전량 예측

</aside>

## 3-1. 일조시간 정량 분석 엔진

```tsx
// src/utils/solar.ts
export function analyzeSunlight(buildings, targetArea, date, latitude) {
  const results = [];

  for (let hour = 5; hour <= 19; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const sunPos = calcSunPosition(latitude, getDayOfYear(date), hour + min / 60);
      if (sunPos.altitude <= 0) continue;

      const shadows = buildings.map((b) => calcBuildingShadow(b, sunPos));
      const sunlitPercent = calcSunlitPercent(targetArea, shadows, {
        sampleDensity: 100,
      });

      results.push({
        hour,
        minute: min,
        sunAltitude: sunPos.altitude,
        sunAzimuth: sunPos.azimuth,
        sunlitPercent,
      });
    }
  }

  return results;
}

export function calcContinuousSunlightHours(hourlyData, threshold = 50) {
  let maxContinuous = 0;
  let currentStreak = 0;
  let totalMinutes = 0;

  for (const data of hourlyData) {
    if (data.sunlitPercent >= threshold) {
      currentStreak += 10;
      totalMinutes += 10;
    } else {
      maxContinuous = Math.max(maxContinuous, currentStreak);
      currentStreak = 0;
    }
  }

  maxContinuous = Math.max(maxContinuous, currentStreak);

  return {
    maxContinuous: maxContinuous / 60,
    totalHours: totalMinutes / 60,
  };
}
```

## 3-2. 한국 일조권 법규 자동 판정

```tsx
// src/utils/legal.ts
export interface LegalCheckResult {
  standard: string;
  description: string;
  requiredHours: number;
  actualHours: number;
  passed: boolean;
  details: string;
}

export function checkKoreanSunlightLaw(
  continuousHours: number,
  totalHours: number,
  date: Date,
): LegalCheckResult[] {
  const results: LegalCheckResult[] = [];

  results.push({
    standard: '건축법 시행령 제86조',
    description: '동지일(12/22) 기준 09:00~15:00 사이 연속 2시간 이상 일조 확보',
    requiredHours: 2,
    actualHours: continuousHours,
    passed: continuousHours >= 2,
    details:
      continuousHours >= 2
        ? `✅ 연속 ${continuousHours.toFixed(1)}시간 일조 확보 — 적합`
        : `❌ 연속 ${continuousHours.toFixed(1)}시간 — 부적합 (2시간 미만)`,
  });

  results.push({
    standard: '건축법 시행령 제86조 (대체기준)',
    description: '동지일(12/22) 기준 08:00~16:00 사이 총 누적 4시간 이상',
    requiredHours: 4,
    actualHours: totalHours,
    passed: totalHours >= 4,
    details:
      totalHours >= 4
        ? `✅ 누적 ${totalHours.toFixed(1)}시간 일조 — 적합`
        : `❌ 누적 ${totalHours.toFixed(1)}시간 — 부적합 (4시간 미만)`,
  });

  return results;
}

export function getWinterSolstice(year: number): Date {
  return new Date(year, 11, 22);
}
```

## 3-3. 태양광 발전량 예측

```tsx
// src/components/Analysis/SolarPanel.tsx
const IRRADIANCE_BY_REGION: Record<string, number> = {
  서울: 3.6,
  부산: 3.9,
  제주: 3.8,
  대구: 3.7,
  광주: 3.7,
  대전: 3.6,
  default: 3.6,
};

export function estimateSolarPanelOutput(
  areaM2: number,
  sunlitPercent: number,
  city: string = 'default',
  panelEfficiency: number = 0.2,
) {
  const dailyIrradiance = IRRADIANCE_BY_REGION[city] || IRRADIANCE_BY_REGION.default;
  const dailyKwh = areaM2 * dailyIrradiance * panelEfficiency * (sunlitPercent / 100);
  const annualKwh = dailyKwh * 365;
  const annualSavingsKRW = Math.round(annualKwh * 120);
  const capacityKW = areaM2 * panelEfficiency;
  const installCostKRW = capacityKW * 1_500_000;
  const paybackYears = installCostKRW / annualSavingsKRW;

  return {
    areaM2,
    dailyKwh: Math.round(dailyKwh * 10) / 10,
    annualKwh: Math.round(annualKwh),
    annualSavingsKRW,
    installCostKRW: Math.round(installCostKRW),
    paybackYears: Math.round(paybackYears * 10) / 10,
  };
}
```

## 3-4. 월별 일조 히트맵

```tsx
// src/components/Chart/MonthlyHeatmap.tsx
// 12개월 × 24시간 그리드 히트맵
// X축: 시간 (6:00~18:00)
// Y축: 월 (1월~12월)
// 색상: 빨강(0%) → 노랑(50%) → 초록(100%)
// 각 월 15일 기준 계산
```

---

# PHASE 4 — UI/UX 전면 리디자인

<aside>
🎨

**목표:** 다크 테마 프로페셔널 대시보드 스타일

**도구:** Tailwind CSS

</aside>

## 4-1. 디자인 토큰

```css
/* src/styles/tokens.css */
:root {
  --bg-primary: #0f0f14;
  --bg-secondary: #1a1a24;
  --bg-card: #16161e;
  --bg-hover: #1e1e2a;

  --text-primary: #e8e8ef;
  --text-secondary: #8b8b9e;
  --text-muted: #5a5a6e;

  --color-sun: #ffa502;
  --color-shadow: #2d2d44;
  --color-sunlit: #00d4aa;
  --color-shaded: #ff4757;
  --color-warning: #ffa502;
  --color-success: #00d4aa;
  --color-danger: #ff4757;
  --color-info: #3b82f6;

  --color-building: #4a4a6a;
  --color-building-hover: #6a6a8a;
  --color-target-area: rgba(255, 165, 2, 0.15);
  --color-target-border: #ffa502;

  --border-color: rgba(255, 255, 255, 0.06);
  --border-radius: 12px;

  --font-sans: 'Pretendard', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

## 4-2. 레이아웃 구조

```text
┌────────────────────────────────────────────────────────────────┐
│  Header: 로고 + 주소 검색 바 + 도시 선택 + 날짜 선택           │
├──────────────┬─────────────────────────────┬───────────────────┤
│              │                             │                   │
│  사이드 패널  │     메인 뷰 (2D/3D/Split)    │   분석 결과 패널   │
│              │                             │                   │
│  - 건물 리스트│     ┌─────────┬─────────┐   │  - 일조시간        │
│  - 건물 추가  │     │  2D 뷰  │  3D 뷰  │   │  - 법규 판정       │
│  - 높이 조절  │     │         │         │   │  - 태양광 예측     │
│  - 공터 설정  │     └─────────┴─────────┘   │  - PDF 내보내기    │
│              │                             │                   │
│              │  ┌─────────────────────────┐ │                   │
│              │  │  시간 슬라이더 + 재생    │ │                   │
│              │  └─────────────────────────┘ │                   │
├──────────────┴─────────────────────────────┴───────────────────┤
│  하단: 일조 그래프 (시간별) + 월별 히트맵                        │
└────────────────────────────────────────────────────────────────┘
```

## 4-3. 분석 결과 카드 UI

```tsx
// src/components/Analysis/SunlightAnalysis.tsx
// 카드 형태로:
// 1. 일조시간 요약
// 2. 법규 적합 판정
// 3. 태양광 발전량 예측
```

## 4-4. 신축 건물 영향 비교 (Before/After)

```tsx
// 신축 건물 추가 시:
// 1. 기존 상태 분석 저장
// 2. 신축 포함 상태 분석
// 3. Before/After 비교 표시
// 4. 영향받는 영역 2D 뷰에서 빨간색 하이라이트
```

---

# PHASE 5 — 내보내기 & 공유

<aside>
📤

**목표:** PDF 리포트 + URL 상태 공유 + 스크린샷 다운로드

</aside>

## 5-1. PDF 리포트 생성

```tsx
// src/components/Analysis/ReportExport.tsx
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateReport(analysis: AnalysisResult) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.setFontSize(24);
  pdf.text('일조권 분석 리포트', 20, 40);
  pdf.setFontSize(12);
  pdf.text(`위치: ${analysis.location.address}`, 20, 60);
  pdf.text(`분석일: ${analysis.date}`, 20, 70);
  pdf.text(`좌표: ${analysis.location.lat}, ${analysis.location.lng}`, 20, 80);
  pdf.save(`일조분석_${analysis.location.address}_${analysis.date}.pdf`);
}
```

## 5-2. URL 상태 공유

```tsx
// src/hooks/useUrlSync.ts
import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useUrlSync() {
  const { latitude, longitude, date, hour } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng) {
      useStore.getState().setLocation(parseFloat(lat), parseFloat(lng), params.get('address') || '');
    }
    const dateStr = params.get('date');
    if (dateStr) useStore.getState().setDate(new Date(dateStr));
    const h = params.get('hour');
    if (h) useStore.getState().setTime(parseInt(h), 0);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('lat', latitude.toFixed(4));
    params.set('lng', longitude.toFixed(4));
    params.set('date', date.toISOString().split('T')[0]);
    params.set('hour', hour.toString());
    window.history.replaceState({}, '', `?${params}`);
  }, [latitude, longitude, date, hour]);
}
```

## 5-3. 스크린샷 다운로드

```tsx
export async function downloadScreenshot(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { backgroundColor: '#0f0f14' });
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL();
  link.click();
}
```

---

# PHASE 6 — 성능 & 테스트

<aside>
⚡

**목표:** Web Worker 분리, 렌더링 최적화, 테스트 커버리지

</aside>

## 6-1. Web Worker로 무거운 계산 분리

```tsx
// src/workers/solarWorker.ts
self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'ANALYZE_DAY': {
      const result = analyzeSunlight(
        payload.buildings,
        payload.targetArea,
        new Date(payload.date),
        payload.latitude,
      );
      self.postMessage({ type: 'DAY_RESULT', payload: result });
      break;
    }
    case 'ANALYZE_YEAR': {
      const heatmap = analyzeYearlyHeatmap(
        payload.buildings,
        payload.targetArea,
        payload.year,
        payload.latitude,
      );
      self.postMessage({ type: 'YEAR_RESULT', payload: heatmap });
      break;
    }
  }
};
```

## 6-2. Three.js 렌더링 최적화

```tsx
// - InstancedMesh 사용
// - LOD 적용
// - 그림자맵 해상도 최적화
// - 변경 없으면 렌더 스킵
// - unmount 시 dispose()
```

## 6-3. 단위 테스트

```tsx
// tests/solar.test.ts
import { calcSunPosition } from '../src/utils/solar';

describe('Solar Position Calculator', () => {
  test('Seoul Winter Solstice Noon', () => {
    const pos = calcSunPosition(37.5665, 356, 12);
    expect(pos.altitude).toBeCloseTo(29, 0);
    expect(pos.azimuth).toBeCloseTo(180, 1);
  });

  test('Seoul Summer Solstice Noon', () => {
    const pos = calcSunPosition(37.5665, 172, 12);
    expect(pos.altitude).toBeCloseTo(76, 0);
  });

  test('Before sunrise returns negative altitude', () => {
    const pos = calcSunPosition(37.5665, 1, 4);
    expect(pos.altitude).toBeLessThan(0);
    expect(pos.isDay).toBe(false);
  });
});
```

---

# PHASE 7 — Vercel 배포 설정

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

```bash
npm i -g vercel
vercel --prod
```

```html
<meta property="og:title" content="Solar Shadow Map — 일조권 시뮬레이터" />
<meta property="og:description" content="주소 검색만으로 건물 그림자와 일조시간을 분석하세요" />
<meta property="og:image" content="/og-image.png" />
<meta property="og:type" content="website" />
```

---

# PHASE 8 — README.md 리디자인

```markdown
# ☀️ Solar Shadow Map

**주소 검색만으로 건물 그림자와 일조시간을 분석하는 인터랙티브 웹 서비스**

🔗 [Live Demo](https://solar-shadow-map.vercel.app)

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🗺️ 주소 검색 | 카카오맵 기반 위치 검색 + 주변 건물 자동 로딩 |
| 🏗️ 2D/3D 시뮬레이션 | 실시간 건물 그림자 렌더링 (Canvas 2D + Three.js) |
| 📊 일조 분석 | 시간별 일조율, 연속 일조시간, 월별 히트맵 |
| ⚖️ 법규 판정 | 건축법 시행령 제86조 기준 자동 적합성 검사 |
| ⚡ 태양광 예측 | 설치 면적 기반 연간 발전량 + 절감 금액 산출 |
| 📄 PDF 리포트 | 분석 결과 자동 리포트 생성 및 다운로드 |

## 기술 스택

React 19 · TypeScript · Vite · Three.js · Chart.js · Tailwind CSS · Zustand · Kakao Maps API · VWORLD API

## 실행

```bash
git clone https://github.com/zln02/solar-shadow-map-.git
cd solar-shadow-map-
npm install
npm run dev
```
```

---

# Claude Sonnet 실행 지시

<aside>
🤖

**아래 프롬프트 블록을 Claude Sonnet에게 전달하세요.**

</aside>

```text
You are upgrading the Solar Shadow Map project — a building shadow / sunlight simulation web app.
Repository: solar-shadow-map (React 19 + Vite + Three.js + Chart.js)

=== EXECUTION ORDER ===

PHASE 1 — ARCHITECTURE (Do first)
1. Convert all .jsx to .tsx (TypeScript)
2. Create src/types/index.ts with all type definitions
3. Install & configure: zustand, tailwindcss, @types/three
4. Create src/store/useStore.ts (Zustand global state)
5. Restructure into component directories: Map/, Canvas2D/, ThreeView/, Chart/, Controls/, Analysis/, UI/
6. Extract calculation logic into: utils/solar.ts, utils/shadow.ts, utils/geometry.ts
7. Create custom hooks: useSolarPosition, useShadowCalculation, useBuildings, useAnimation

PHASE 2 — KAKAO MAP + PUBLIC DATA
8. Add Kakao Maps JavaScript SDK to index.html
9. Create AddressSearch.tsx — address search bar with autocomplete
10. Create KakaoMap.tsx — map with building polygons overlay
11. Create usePublicData.ts hook — fetch buildings from VWORLD API (radius 200m)
12. Auto-populate buildings list when user selects an address
13. Allow manual building add/edit on top of public data

PHASE 3 — ANALYSIS ENGINE
14. Enhance solar.ts with 10-minute interval analysis (sunrise to sunset)
15. Create utils/legal.ts — Korean Building Act Article 86 compliance check
16. Add continuous sunlight hour calculation (연속 일조시간)
17. Add total accumulated sunlight hour calculation (누적 일조시간)
18. Create SolarPanel estimation (area × irradiance × efficiency)
19. Create MonthlyHeatmap — 12 months × hours heatmap visualization
20. Add Before/After comparison for new building impact

PHASE 4 — UI REDESIGN
21. Apply dark theme design tokens (tokens.css)
22. Implement dashboard layout: Sidebar | Main (2D/3D split) | Analysis Panel | Bottom Charts
23. Create analysis result cards: Sunlight Summary, Legal Check, Solar Panel Estimate
24. Apply JetBrains Mono for numbers, Pretendard for text
25. Add view mode toggle: 2D only / 3D only / Split view
26. Make fully responsive (mobile-friendly)

PHASE 5 — EXPORT & DEPLOY
27. Add PDF report generation (html2canvas + jsPDF)
28. Add URL state sync (lat, lng, date, hour as query params)
29. Add screenshot download (PNG)
30. Configure vercel.json for deployment
31. Add OG meta tags for link previews
32. Rewrite README.md with badges, screenshots, live demo link

PHASE 6 — PERFORMANCE & TESTING
33. Move heavy calculations to Web Worker (solarWorker.ts)
34. Optimize Three.js: InstancedMesh, dispose on unmount
35. Add unit tests: solar position accuracy, convex hull edge cases
36. Verify solar position against known astronomical data

=== CONSTRAINTS ===
- Maintain all existing functionality (2D view, 3D view, time slider, city presets)
- Use existing solar calculation algorithms as base (enhance, don't replace)
- All UI text in Korean
- Dark theme only (no light mode needed)
- No backend server — everything runs client-side
- API keys via environment variables (VITE_KAKAO_API_KEY, VITE_VWORLD_API_KEY)
- If VWORLD API is unavailable, fall back to manual building placement gracefully

=== TESTING ===
- Solar position: Compare with known Seoul solstice data (winter ~29° noon, summer ~76° noon)
- Convex Hull: Test with collinear points, single point, duplicate points
- Legal check: Test with edge cases (exactly 2h, exactly 4h, 0h)
- Responsive: Test on 375px, 768px, 1440px widths
```

---

# 체크리스트

## Phase 1: 아키텍처

- [ ] TypeScript 전환
- [ ] Zustand 상태 관리
- [ ] 컴포넌트/훅 분리
- [ ] Tailwind CSS 설정

## Phase 2: 지도 & 데이터

- [ ] 카카오맵 주소 검색
- [ ] VWORLD 건물 데이터 연동
- [ ] 지도 위 건물 오버레이
- [ ] 수동 건물 추가/편집

## Phase 3: 분석 엔진

- [ ] 일조시간 정량 분석 (10분 간격)
- [ ] 한국 일조권 법규 판정
- [ ] 태양광 발전량 예측
- [ ] 월별 히트맵
- [ ] 신축 영향 Before/After

## Phase 4: UI 리디자인

- [ ] 다크 테마 디자인 토큰
- [ ] 대시보드 레이아웃
- [ ] 분석 결과 카드
- [ ] 반응형 모바일

## Phase 5: 배포 & 공유

- [ ] PDF 리포트 생성
- [ ] URL 상태 공유
- [ ] Vercel 배포
- [ ] README 리디자인

## Phase 6: 성능 & 테스트

- [ ] Web Worker 분리
- [ ] Three.js 최적화
- [ ] 단위 테스트
