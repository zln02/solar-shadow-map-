import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import "./App.css";
import { AddressSearch } from "./components/AddressSearch";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { AnnualHeatmap } from "./components/AnnualHeatmap";
import { BuildingSidebar } from "./components/BuildingSidebar";
import { KakaoMapPanel } from "./components/KakaoMapPanel";
import { PlanCanvas } from "./components/PlanCanvas";
import { CITY_PRESETS, DEFAULT_MANUAL_BUILDINGS, DEFAULT_TARGET_AREA } from "./data/cities";
import { useKakaoLoader } from "./hooks/useKakaoLoader";
import { usePublicBuildings } from "./hooks/usePublicBuildings";
import { useSolarAnalysis } from "./hooks/useSolarAnalysis";
import { exportSnapshot, loadSnapshots, removeSnapshot, saveSnapshot } from "./utils/storage";

const Scene3D = lazy(() => import("./components/Scene3D").then((module) => ({ default: module.Scene3D })));
const SunlightChart = lazy(() =>
  import("./components/SunlightChart").then((module) => ({ default: module.SunlightChart })),
);

function resolveRegionKey(address) {
  const matched = CITY_PRESETS.find((city) => address.includes(city.name));
  return matched?.regionKey || "서울";
}

function dateValue(date) {
  return date.toISOString().split("T")[0];
}

function timeLabel(value) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function App() {
  const [location, setLocation] = useState(() => ({
    address: CITY_PRESETS[0].address,
    lat: CITY_PRESETS[0].lat,
    lng: CITY_PRESETS[0].lng,
    regionKey: CITY_PRESETS[0].regionKey,
  }));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [timeValue, setTimeValue] = useState(12);
  const [viewMode, setViewMode] = useState("split");
  const [selectedId, setSelectedId] = useState("");
  const [manualBuildings, setManualBuildings] = useState(DEFAULT_MANUAL_BUILDINGS);
  const [snapshots, setSnapshots] = useState(() => loadSnapshots());
  const [toast, setToast] = useState("");
  const targetArea = useMemo(() => DEFAULT_TARGET_AREA, []);

  const { isReady: kakaoReady } = useKakaoLoader();
  const publicData = usePublicBuildings(location);
  const buildings = useMemo(
    () => [...publicData.buildings, ...manualBuildings],
    [manualBuildings, publicData.buildings],
  );
  const { dayAnalysis, yearAnalysis, loading } = useSolarAnalysis({
    buildings,
    targetArea,
    date: selectedDate,
    latitude: location.lat,
  });

  const selectedBuilding = buildings.find((building) => building.id === selectedId) ?? null;
  const publicBuildingCount = buildings.filter((building) => building.source === "public_data").length;

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === "split") setViewMode("2d");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  const activeSnapshotPayload = useMemo(
    () => ({
      name: `${location.address} ${dateValue(selectedDate)} 시나리오`,
      location,
      selectedDate: dateValue(selectedDate),
      timeValue,
      manualBuildings,
    }),
    [location, manualBuildings, selectedDate, timeValue],
  );

  const addManualBuilding = (pointer) => {
    const nextId = `manual-${Date.now()}`;
    setManualBuildings((current) => [
      ...current,
      {
        id: nextId,
        name: "신축 건물",
        x: Math.round(pointer.x * 10) / 10,
        y: Math.round(pointer.y * 10) / 10,
        width: 12,
        depth: 16,
        height: 18,
        floors: 5,
        source: "manual",
        color: "#f59e0b",
      },
    ]);
    setSelectedId(nextId);
  };

  const handleImportSnapshot = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      setLocation({
        ...payload.location,
        regionKey: payload.location.regionKey || resolveRegionKey(payload.location.address || ""),
      });
      setSelectedDate(new Date(payload.selectedDate));
      setTimeValue(payload.timeValue ?? 12);
      setManualBuildings(
        payload.manualBuildings ??
          (payload.buildings ?? DEFAULT_MANUAL_BUILDINGS).filter((building) => building.source !== "public_data"),
      );
      setToast("저장된 JSON 시나리오를 불러왔습니다.");
    } catch {
      setToast("JSON 파일 형식을 확인해 주세요.");
    }
  };

  return (
    <div className="app-shell">
      <header className="hero-shell">
        <div>
          <p className="hero-kicker">Solar Shadow Map</p>
          <h1>실제 주소를 기준으로 공터 일조권을 분석하는 인터랙티브 시뮬레이터</h1>
          <p className="hero-copy">
            카카오 주소 검색과 VWorld 건물 데이터로 주변 건물을 불러오고, 하루와 연간 일조 변화를
            2D·3D로 바로 확인하세요.
          </p>
        </div>
        <div className="hero-badges">
          <span>실주소 검색</span>
          <span>공공 건물 데이터</span>
          <span>연간 일조 히트맵</span>
          <span>모바일 대응</span>
        </div>
      </header>

      <AddressSearch
        key={location.address}
        kakaoReady={kakaoReady}
        location={location}
        cities={CITY_PRESETS}
        onSelectLocation={(nextLocation) =>
          setLocation({
            ...nextLocation,
            regionKey: nextLocation.regionKey || resolveRegionKey(nextLocation.address),
          })
        }
      />

      <section className="top-grid">
        <div className="panel controls-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">시뮬레이션 컨트롤</p>
              <h3>날짜·시간·뷰 전환</h3>
            </div>
          </div>
          <div className="control-grid">
            <label>
              기준 날짜
              <input
                type="date"
                value={dateValue(selectedDate)}
                onChange={(event) => setSelectedDate(new Date(`${event.target.value}T12:00:00`))}
              />
            </label>
            <label>
              시간
              <input
                type="range"
                min="6"
                max="19"
                step="0.25"
                value={timeValue}
                onChange={(event) => setTimeValue(Number(event.target.value))}
              />
              <span className="mono">{timeLabel(timeValue)}</span>
            </label>
            <label>
              뷰 모드
              <div className="segmented">
                {[
                  ["2d", "2D"],
                  ["split", "Split"],
                  ["3d", "3D"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={viewMode === value ? "segment active" : "segment"}
                    onClick={() => setViewMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div className="status-strip">
            <span>{publicData.message}</span>
            <strong>{loading ? "연간 분석 계산 중..." : `공공건물 ${publicBuildingCount}동 반영`}</strong>
          </div>
        </div>

        <KakaoMapPanel
          kakaoReady={kakaoReady}
          location={location}
          buildings={buildings}
          targetArea={targetArea}
        />
      </section>

      <main className="content-grid">
        <BuildingSidebar
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          onSelect={setSelectedId}
          onUpdate={(id, updates) =>
            setManualBuildings((current) =>
              current.map((building) => (building.id === id ? { ...building, ...updates } : building)),
            )
          }
          onRemove={(id) => {
            setManualBuildings((current) => current.filter((building) => building.id !== id));
            setSelectedId("");
          }}
          onSaveSnapshot={() => {
            const nextSnapshots = saveSnapshot(activeSnapshotPayload);
            setSnapshots(nextSnapshots);
            setToast("현재 시나리오를 로컬에 저장했습니다.");
          }}
          onExportSnapshot={() => exportSnapshot(activeSnapshotPayload)}
          onImportSnapshot={handleImportSnapshot}
          savedSnapshots={snapshots}
          onLoadSnapshot={(snapshotId) => {
            const snapshot = snapshots.find((item) => item.id === snapshotId);
            if (!snapshot) return;
            setLocation(snapshot.location);
            setSelectedDate(new Date(snapshot.selectedDate));
            setTimeValue(snapshot.timeValue ?? 12);
            setManualBuildings(
              snapshot.manualBuildings ??
                (snapshot.buildings ?? DEFAULT_MANUAL_BUILDINGS).filter((building) => building.source !== "public_data"),
            );
            setToast("저장된 시나리오를 불러왔습니다.");
          }}
          onDeleteSnapshot={(snapshotId) => {
            const nextSnapshots = removeSnapshot(snapshotId);
            setSnapshots(nextSnapshots);
          }}
          dataMessage={publicData.error || publicData.message}
          loadingPublicData={publicData.loading}
        />

        <section className="visual-column">
          {viewMode !== "3d" ? (
            <PlanCanvas
              buildings={buildings}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              setBuildings={setManualBuildings}
              targetArea={targetArea}
              date={selectedDate}
              latitude={location.lat}
              timeValue={timeValue}
              addManualBuilding={addManualBuilding}
            />
          ) : null}

          {viewMode !== "2d" ? (
            <Suspense fallback={<section className="panel loading-panel">3D 장면 로딩 중...</section>}>
              <Scene3D
                buildings={buildings}
                targetArea={targetArea}
                selectedId={selectedId}
                date={selectedDate}
                latitude={location.lat}
                timeValue={timeValue}
              />
            </Suspense>
          ) : null}

          <Suspense fallback={<section className="panel loading-panel">차트 모듈 로딩 중...</section>}>
            <SunlightChart hourlyData={dayAnalysis.hourlyData} />
          </Suspense>
          <AnnualHeatmap data={yearAnalysis} />
        </section>

        <AnalysisPanel
          summary={dayAnalysis.summary}
          yearAnalysis={yearAnalysis}
          location={location}
          selectedDate={dateValue(selectedDate)}
          publicBuildingCount={publicBuildingCount}
        />
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

export default App;
