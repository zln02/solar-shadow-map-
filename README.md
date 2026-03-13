# Solar Shadow Map

<p align="center"><strong>건물 그림자가 공터에 미치는 영향을 시뮬레이션하는 인터랙티브 웹 앱</strong></p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" /></a>
  <a href="https://threejs.org"><img src="https://img.shields.io/badge/Three.js-0.183-black?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" /></a>
  <a href="https://www.chartjs.org"><img src="https://img.shields.io/badge/Chart.js-4.5-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" /></a>
</p>

<p align="center">
  <a href="https://solar-shadow-map.vercel.app">Live Demo</a>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **2D Floor Plan** | Canvas 기반 건물 배치, 드래그/추가/삭제/높이 조절 |
| **3D View** | Three.js PCF Soft Shadow Map으로 실시간 3D 렌더링 |
| **Sunlight Chart** | Chart.js 이중 Y축 — 시간대별 일조 면적(%) + 태양 고도각 |
| **Day Playback** | 시간 슬라이더 애니메이션으로 하루 그림자 변화 재생 |
| **City Presets** | 서울 · 부산 · 제주 · 도쿄 · 뉴욕 위도 프리셋 |

## How It Works

```
태양 위치 계산 (위도 + Day of Year)
        │
        ▼
  고도각 · 방위각 → 건물별 그림자 투영
        │
        ▼
  Convex Hull (Andrew's Monotone Chain)
        │
        ▼
  Point-in-Polygon (Ray Casting) → 일조 면적 %
```

### Core Algorithms

- **Solar Position** — 위도와 일수(Day of Year) 기반 천문 공식으로 태양 고도각·방위각 계산
- **Shadow Projection** — 건물 높이 + 태양 고도각으로 그림자 길이·방향 산출
- **Convex Hull** — Andrew's Monotone Chain 알고리즘으로 그림자 다각형 생성
- **Sunlit Area** — Ray Casting 기반 Point-in-Polygon으로 공터 내 일조 면적 샘플링

## Tech Stack

- **React 19** — Hooks (useState, useEffect, useRef, useMemo)
- **Three.js** — 3D 렌더링, PCFSoftShadowMap, OrbitControls
- **Chart.js** — 반응형 Bar/Line 복합 차트
- **Canvas 2D API** — 커스텀 2D 평면도 렌더러
- **Vite 8** — HMR, 빌드 최적화

## Quick Start

```bash
git clone https://github.com/zln02/solar-shadow-map-.git
cd solar-shadow-map-
npm install
npm run dev
```

`http://localhost:5173` 에서 확인

## Project Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # App wrapper
├── ShadowSimulator.jsx   # Core simulator (660 lines)
│   ├── Solar position calculation
│   ├── 2D Canvas renderer
│   ├── Three.js 3D scene
│   └── Chart.js sunlight graph
├── App.css               # Styles
└── index.css             # Global styles
```

## Deployment

Vercel에 배포됨. `main` 브랜치 push 시 자동 배포.

```bash
npm run build   # dist/ 생성
npm run preview # 로컬 프리뷰
```

## License

MIT
