import { useEffect, useMemo, useRef, useState } from "react";

export function useSolarAnalysis({ buildings, targetArea, date, latitude }) {
  const workerRef = useRef(null);
  const [dayAnalysis, setDayAnalysis] = useState({ hourlyData: [], summary: null });
  const [yearAnalysis, setYearAnalysis] = useState({ months: [], hours: [], matrix: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../workers/solarWorker.js", import.meta.url), {
        type: "module",
      });
    }

    const worker = workerRef.current;
    const dayRequestId = `day-${Date.now()}`;
    const yearRequestId = `year-${Date.now()}`;
    Promise.resolve().then(() => setLoading(true));

    const handleMessage = (event) => {
      const { type, requestId, payload } = event.data;
      if (type === "DAY_RESULT" && requestId === dayRequestId) {
        setDayAnalysis(payload);
      }
      if (type === "YEAR_RESULT" && requestId === yearRequestId) {
        setYearAnalysis(payload);
        setLoading(false);
      }
    };

    worker.addEventListener("message", handleMessage);
    worker.postMessage({
      type: "ANALYZE_DAY",
      requestId: dayRequestId,
      payload: {
        buildings,
        targetArea,
        date: date.toISOString(),
        latitude,
      },
    });
    worker.postMessage({
      type: "ANALYZE_YEAR",
      requestId: yearRequestId,
      payload: {
        buildings,
        targetArea,
        year: date.getFullYear(),
        latitude,
      },
    });

    return () => {
      worker.removeEventListener("message", handleMessage);
    };
  }, [buildings, targetArea, date, latitude]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
    },
    [],
  );

  return useMemo(
    () => ({
      dayAnalysis,
      yearAnalysis,
      loading,
    }),
    [dayAnalysis, yearAnalysis, loading],
  );
}
