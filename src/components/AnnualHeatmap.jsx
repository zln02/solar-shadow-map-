function colorForValue(value) {
  if (value >= 80) return "rgba(16, 185, 129, 0.92)";
  if (value >= 55) return "rgba(245, 158, 11, 0.9)";
  if (value >= 30) return "rgba(249, 115, 22, 0.88)";
  return "rgba(239, 68, 68, 0.82)";
}

export function AnnualHeatmap({ data }) {
  return (
    <section className="panel heatmap-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">연간 분석</p>
          <h3>월별 일조 히트맵</h3>
        </div>
      </div>
      <div className="heatmap-grid">
        <div className="heatmap-row header">
          <span />
          {data.hours.map((hour) => (
            <span key={hour}>{hour}:00</span>
          ))}
        </div>
        {data.months.map((month, rowIndex) => (
          <div key={month} className="heatmap-row">
            <span>{month}월</span>
            {data.matrix[rowIndex].map((value, columnIndex) => (
              <button
                type="button"
                key={`${month}-${data.hours[columnIndex]}`}
                className="heatmap-cell"
                style={{ background: colorForValue(value) }}
                title={`${month}월 ${data.hours[columnIndex]}시 평균 일조율 ${value}%`}
              >
                {value}
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
