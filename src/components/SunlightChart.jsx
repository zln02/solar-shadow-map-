import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function SunlightChart({ hourlyData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !hourlyData.length) return undefined;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: hourlyData.map((slot) => slot.label),
        datasets: [
          {
            type: "bar",
            label: "일조 면적",
            data: hourlyData.map((slot) => slot.sunlitPercent),
            backgroundColor: "rgba(16, 185, 129, 0.55)",
            borderRadius: 999,
            yAxisID: "sunlit",
          },
          {
            type: "line",
            label: "태양 고도각",
            data: hourlyData.map((slot) => slot.altitude),
            borderColor: "#f59e0b",
            borderWidth: 2,
            fill: false,
            tension: 0.28,
            pointRadius: 0,
            yAxisID: "altitude",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#cbd5e1",
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#64748b",
              maxRotation: 0,
              autoSkip: true,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.08)",
            },
          },
          sunlit: {
            position: "left",
            min: 0,
            max: 100,
            ticks: { color: "#34d399", callback: (value) => `${value}%` },
            grid: { color: "rgba(148, 163, 184, 0.08)" },
          },
          altitude: {
            position: "right",
            min: 0,
            max: 90,
            ticks: { color: "#f59e0b", callback: (value) => `${value}°` },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [hourlyData]);

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">일중 분석</p>
          <h3>시간대별 일조 변화</h3>
        </div>
      </div>
      <div className="chart-shell">
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}
