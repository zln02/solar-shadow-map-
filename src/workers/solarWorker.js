import { analyzeDay, analyzeYear, summarizeDay } from "../utils/solar";

self.onmessage = (event) => {
  const { type, payload, requestId } = event.data;

  if (type === "ANALYZE_DAY") {
    const hourlyData = analyzeDay(
      payload.buildings,
      payload.targetArea,
      new Date(payload.date),
      payload.latitude,
    );

    self.postMessage({
      type: "DAY_RESULT",
      requestId,
      payload: {
        hourlyData,
        summary: summarizeDay(hourlyData),
      },
    });
    return;
  }

  if (type === "ANALYZE_YEAR") {
    self.postMessage({
      type: "YEAR_RESULT",
      requestId,
      payload: analyzeYear(
        payload.buildings,
        payload.targetArea,
        payload.year,
        payload.latitude,
      ),
    });
  }
};
