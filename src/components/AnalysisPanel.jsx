function formatNumber(value, suffix = "") {
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}${suffix}`;
}

export function AnalysisPanel({ summary, yearAnalysis, location, selectedDate, publicBuildingCount }) {
  const bestMonthIndex = yearAnalysis.matrix.length
    ? yearAnalysis.matrix
        .map((row, index) => ({
          index,
          score: row.reduce((sum, value) => sum + value, 0) / row.length,
        }))
        .sort((a, b) => b.score - a.score)[0]?.index ?? 0
    : 0;

  const bestMonthScore = yearAnalysis.matrix.length
    ? yearAnalysis.matrix[bestMonthIndex].reduce((sum, value) => sum + value, 0) / yearAnalysis.matrix[bestMonthIndex].length
    : 0;

  return (
    <aside className="analysis-panel">
      <section className="panel stat-card">
        <p className="eyebrow">분석 요약</p>
        <h3>선택 일자 일조량</h3>
        <div className="metric-grid">
          <div>
            <span>평균 일조율</span>
            <strong>{formatNumber(summary?.averageSunlitPercent ?? 0, "%")}</strong>
          </div>
          <div>
            <span>누적 일조시간</span>
            <strong>{formatNumber(summary?.totalSunlightHours ?? 0, "h")}</strong>
          </div>
          <div>
            <span>연속 일조시간</span>
            <strong>{formatNumber(summary?.continuousSunlightHours ?? 0, "h")}</strong>
          </div>
          <div>
            <span>불러온 건물</span>
            <strong>{publicBuildingCount}동</strong>
          </div>
        </div>
      </section>

      <section className="panel stat-card">
        <p className="eyebrow">대상 위치</p>
        <h3>{location.address}</h3>
        <ul className="meta-list">
          <li>
            <span>위도</span>
            <strong>{location.lat.toFixed(5)}</strong>
          </li>
          <li>
            <span>경도</span>
            <strong>{location.lng.toFixed(5)}</strong>
          </li>
          <li>
            <span>분석 날짜</span>
            <strong>{selectedDate}</strong>
          </li>
        </ul>
      </section>

      <section className="panel stat-card">
        <p className="eyebrow">연간 인사이트</p>
        <h3>베스트 일조 구간</h3>
        <ul className="meta-list">
          <li>
            <span>가장 유리한 달</span>
            <strong>{bestMonthIndex + 1}월</strong>
          </li>
          <li>
            <span>평균 일조율</span>
            <strong>{formatNumber(bestMonthScore, "%")}</strong>
          </li>
          <li>
            <span>해석</span>
            <strong>{bestMonthScore >= 70 ? "태양광 설치 우수" : bestMonthScore >= 45 ? "조건부 적합" : "음영 영향 큼"}</strong>
          </li>
        </ul>
      </section>
    </aside>
  );
}
