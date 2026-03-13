# Solar Shadow Map

실제 주소 검색과 공공 건물 데이터를 기반으로 공터 일조권을 분석하는 React 기반 웹 앱입니다.  
주소를 선택하면 주변 건물을 자동으로 불러오고, 2D 평면도와 React Three Fiber 3D 뷰에서 하루 및 연간 일조 변화를 바로 확인할 수 있습니다.

## 핵심 업그레이드

- 카카오 주소 검색으로 실제 위치 선택
- VWorld 건물 데이터로 반경 200m 건물 자동 로딩
- 다크모드 기반 반응형 대시보드 UI
- 날짜 선택 + 시간 슬라이더 + 연간 일조 히트맵
- 건물 시나리오 로컬 저장 / JSON 내보내기 / JSON 불러오기
- Web Worker 기반 일조 계산 분리
- Three.js 직접 제어 대신 React Three Fiber 기반 3D 장면

## 기술 스택

- React 19
- Vite 8
- React Three Fiber + Drei
- Chart.js
- Canvas 2D API
- Kakao Maps JavaScript SDK
- VWorld Data API

## 실행

```bash
git clone https://github.com/zln02/solar-shadow-map-.git
cd solar-shadow-map-
npm install
cp .env.example .env
```

`.env`에 아래 값을 넣습니다.

```bash
VITE_KAKAO_API_KEY=...
VITE_VWORLD_API_KEY=...
```

그다음 실행합니다.

```bash
npm run dev
```

빌드 확인:

```bash
npm run build
npm run preview
```

## 제공 기능

### 1. 실제 주소 기반 시뮬레이션

- 카카오 주소 검색으로 실제 위치를 선택
- 선택 즉시 위도/경도 갱신
- 지도 위 중심점과 공터 영역 표시

### 2. 실제 건물 데이터 로딩

- VWorld API로 주변 건물 footprint와 높이 정보 로딩
- 공공데이터가 없거나 API 키가 없으면 수동 시뮬레이션 모드로 graceful fallback
- 수동 건물은 신축 가정 시뮬레이션 용도로 유지

### 3. 분석

- 시간대별 일조 면적 차트
- 연속 / 누적 일조시간 계산
- 월별 연간 일조 히트맵
- 날짜별, 시간별 태양 위치 반영

### 4. 저장 / 불러오기

- 로컬 스냅샷 저장
- JSON 파일 내보내기
- 저장한 시나리오 재불러오기

### 5. 성능 개선

- Web Worker에서 하루 / 연간 일조 분석 계산
- React Three Fiber로 3D 렌더링 분리

## 프로젝트 구조

```text
src/
├── components/
│   ├── AddressSearch.jsx
│   ├── KakaoMapPanel.jsx
│   ├── PlanCanvas.jsx
│   ├── Scene3D.jsx
│   ├── SunlightChart.jsx
│   ├── AnnualHeatmap.jsx
│   ├── BuildingSidebar.jsx
│   └── AnalysisPanel.jsx
├── data/
│   └── cities.js
├── hooks/
│   ├── useKakaoLoader.js
│   ├── usePublicBuildings.js
│   └── useSolarAnalysis.js
├── utils/
│   ├── geometry.js
│   ├── publicData.js
│   ├── solar.js
│   └── storage.js
└── workers/
    └── solarWorker.js
```

## 알고리즘 메모

- 태양 위치 계산: 위도 + 연중 일수 + 시각 기반 고도각/방위각 계산
- 그림자 다각형: 건물 직사각형 footprint를 태양 반대 방향으로 투영
- 일조 면적 샘플링: target area grid 샘플의 point-in-polygon 판정
- 연간 분석: 월별 대표일(21일) 기준 시간 샘플 평균

## 배포 메모

- `vercel.json` 포함
- 환경변수는 Vercel 프로젝트 환경변수로 주입
- OG 메타 태그와 preview SVG 포함
