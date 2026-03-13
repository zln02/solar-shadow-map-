export function BuildingSidebar({
  buildings,
  selectedBuilding,
  onSelect,
  onUpdate,
  onRemove,
  onSaveSnapshot,
  onExportSnapshot,
  onImportSnapshot,
  savedSnapshots,
  onLoadSnapshot,
  onDeleteSnapshot,
  dataMessage,
  loadingPublicData,
}) {
  const isManual = selectedBuilding?.source === "manual";

  return (
    <aside className="sidebar">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">건물 데이터</p>
            <h3>주변 건물 + 신축 시뮬레이션</h3>
          </div>
        </div>
        <p className="sidebar-message">{loadingPublicData ? "실제 건물 데이터를 불러오는 중입니다..." : dataMessage}</p>
        <div className="building-list">
          {buildings.map((building) => (
            <button
              key={building.id}
              className={selectedBuilding?.id === building.id ? "building-item active" : "building-item"}
              onClick={() => onSelect(building.id)}
            >
              <div>
                <strong>{building.name}</strong>
                <span>{building.source === "public_data" ? "공공데이터" : "수동 입력"}</span>
              </div>
              <span>{building.height}m</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">편집</p>
            <h3>선택 건물 속성</h3>
          </div>
        </div>
        {selectedBuilding ? (
          <div className="editor-grid">
            {!isManual ? <p className="sidebar-message">공공데이터 건물은 읽기 전용입니다. 신축 시뮬레이션은 수동 건물로 추가해 주세요.</p> : null}
            <label>
              이름
              <input
                value={selectedBuilding.name}
                disabled={!isManual}
                onChange={(event) => onUpdate(selectedBuilding.id, { name: event.target.value })}
              />
            </label>
            <label>
              높이 (m)
              <input
                type="range"
                min="6"
                max="80"
                value={selectedBuilding.height}
                disabled={!isManual}
                onChange={(event) =>
                  onUpdate(selectedBuilding.id, {
                    height: Number(event.target.value),
                    floors: Math.max(1, Math.round(Number(event.target.value) / 3.3)),
                  })
                }
              />
            </label>
            <label>
              폭 (m)
              <input
                type="number"
                min="4"
                max="120"
                value={selectedBuilding.width}
                disabled={!isManual}
                onChange={(event) => onUpdate(selectedBuilding.id, { width: Number(event.target.value) })}
              />
            </label>
            <label>
              깊이 (m)
              <input
                type="number"
                min="4"
                max="120"
                value={selectedBuilding.depth}
                disabled={!isManual}
                onChange={(event) => onUpdate(selectedBuilding.id, { depth: Number(event.target.value) })}
              />
            </label>
            {isManual ? (
              <button className="danger-button" onClick={() => onRemove(selectedBuilding.id)}>
                수동 건물 삭제
              </button>
            ) : null}
          </div>
        ) : (
          <p className="sidebar-message">건물을 선택하면 높이와 크기를 바로 수정할 수 있습니다.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">저장</p>
            <h3>건물 세트 저장/불러오기</h3>
          </div>
        </div>
        <div className="snapshot-actions">
          <button className="primary-button" onClick={onSaveSnapshot}>
            로컬 저장
          </button>
          <button className="secondary-button" onClick={onExportSnapshot}>
            JSON 내보내기
          </button>
          <label className="secondary-button file-button">
            JSON 불러오기
            <input
              type="file"
              accept="application/json"
              onChange={(event) => onImportSnapshot(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="snapshot-list">
          {savedSnapshots.length ? (
            savedSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="snapshot-item">
                <button onClick={() => onLoadSnapshot(snapshot.id)}>
                  <strong>{snapshot.name}</strong>
                  <span>{new Date(snapshot.createdAt).toLocaleString("ko-KR")}</span>
                </button>
                <button className="ghost-button" onClick={() => onDeleteSnapshot(snapshot.id)}>
                  삭제
                </button>
              </div>
            ))
          ) : (
            <p className="sidebar-message">아직 저장된 시나리오가 없습니다.</p>
          )}
        </div>
      </section>
    </aside>
  );
}
