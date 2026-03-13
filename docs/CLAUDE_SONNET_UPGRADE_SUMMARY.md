# Solar Shadow Map 업그레이드 요약본

## 목표

Solar Shadow Map을 데모 수준에서 포트폴리오용 실서비스 수준으로 업그레이드한다.

- 주소 검색 기반 실제 위치 시뮬레이션
- 공공데이터 기반 주변 건물 자동 로딩
- 일조 분석, 법규 판정, 태양광 발전량 예측
- PDF/공유/스크린샷 내보내기
- 다크 테마 기반 프로페셔널 UI
- Vercel 배포 가능한 구조 정비

## 현재 상태

- React 19 + Vite + Three.js + Chart.js + Canvas 2D
- 2D/3D 뷰, 시간 슬라이더, 도시 프리셋은 이미 있음
- 문제:
  - 실제 주소 검색 없음
  - 실제 건물 높이 데이터 없음
  - 리포트/공유 기능 없음
  - 배포 안 됨
  - TypeScript 미사용
  - UI가 포트폴리오 수준 아님

## 핵심 업그레이드

### 1. 아키텍처

- `.jsx` → `.tsx` 전환
- `types/`, `store/`, `hooks/`, `utils/`, `components/` 구조로 분리
- Zustand 전역 상태 도입
- Tailwind CSS + 디자인 토큰 적용

### 2. 지도 + 공공데이터

- 카카오맵 주소 검색 연동
- 주소 선택 시 위도/경도 자동 반영
- VWORLD 또는 국토부 데이터로 반경 200m 건물 자동 로딩
- 수동 건물 추가는 신축 시뮬레이션 용도로 유지

### 3. 분석 엔진

- 10분 간격 일조 분석
- 연속 일조시간 / 누적 일조시간 계산
- 한국 건축법 시행령 제86조 기준 적합성 판정
- 태양광 발전량 및 절감 금액 예측
- 월별 일조 히트맵
- 신축 건물 Before/After 비교

### 4. UI/UX

- 다크 테마 전면 적용
- 레이아웃:
  - 좌측: 건물/공터 편집
  - 중앙: 2D/3D 시뮬레이션
  - 우측: 분석 결과
  - 하단: 시간별 그래프 + 월별 히트맵
- 숫자는 JetBrains Mono, 텍스트는 Pretendard
- 모바일 대응

### 5. 내보내기 + 공유

- PDF 리포트
- URL 상태 공유
- PNG 스크린샷 다운로드
- OG 메타태그
- Vercel 배포 설정

### 6. 성능 + 테스트

- Web Worker로 무거운 계산 분리
- Three.js 렌더링 최적화
- 태양 위치 계산 테스트
- Convex Hull / 기하학 유틸 테스트

## Claude Sonnet 실행 핵심 지시

- 기존 2D/3D/시간 슬라이더/도시 프리셋 기능은 유지
- 기존 태양 계산 알고리즘은 교체하지 말고 확장
- 모든 UI 텍스트는 한국어
- 다크 테마만 지원
- 백엔드 없이 클라이언트 사이드만 사용
- API 키는 환경변수 사용
  - `VITE_KAKAO_API_KEY`
  - `VITE_VWORLD_API_KEY`
- VWORLD가 실패하면 수동 배치로 자연스럽게 폴백

## 우선순위

1. TypeScript + 상태관리 + 구조 분리
2. 카카오맵 주소 검색
3. 공공 건물 데이터 연동
4. 일조/법규 분석 고도화
5. UI 리디자인
6. PDF/공유/배포
7. Worker/테스트/최적화

## 테스트 기준

- 서울 동지 정오 고도각 약 29도
- 서울 하지 정오 고도각 약 76도
- Convex Hull:
  - 공선 점
  - 중복 점
  - 단일 점
- 법규 판정:
  - 정확히 2시간
  - 정확히 4시간
  - 0시간
- 반응형:
  - 375px
  - 768px
  - 1440px

## 관련 문서

- 상세본: [CLAUDE_SONNET_UPGRADE_PROMPT.md](/home/wlsdud5035/CascadeProjects/sunlight-shadow-simulator/CLAUDE_SONNET_UPGRADE_PROMPT.md)
- 프로젝트 개요: [PROJECT.md](/home/wlsdud5035/CascadeProjects/sunlight-shadow-simulator/PROJECT.md)
