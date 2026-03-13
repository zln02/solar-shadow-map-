# 공터 일조권 시뮬레이터

주변 건물의 그림자가 특정 공터에 미치는 영향을 시뮬레이션하는 인터랙티브 웹 앱입니다.

## 기능

- **2D 평면도** — 건물 배치 및 그림자를 캔버스로 렌더링, 건물 드래그/추가/삭제/높이 조절
- **3D 뷰** — Three.js 기반 3D 씬, 마우스로 회전·줌 가능
- **일조 그래프** — Chart.js 이중 Y축 차트로 시간대별 일조 면적(%) 및 태양 고도각 표시
- **하루 재생** — 시간 슬라이더 애니메이션으로 그림자 변화 확인
- **도시 선택** — 서울·부산·제주·도쿄·뉴욕 위도 프리셋

## 사용 기술

- React 19 (Hooks: useState, useEffect, useRef, useMemo)
- Three.js — 3D 렌더링, PCF Soft Shadow Map
- Chart.js — 반응형 바/라인 복합 차트
- Canvas 2D API — 커스텀 2D 렌더러

## 핵심 알고리즘

- **태양 위치 계산** — 위도·일수(Day of Year) 기반 고도각·방위각 천문 공식
- **Convex Hull** — Andrew's Monotone Chain으로 그림자 다각형 생성
- **Point-in-Polygon** — Ray Casting으로 일조 면적 샘플링 계산

## 실행 방법

```bash
npm install
npm run dev
```
