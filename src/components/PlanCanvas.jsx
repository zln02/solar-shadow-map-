import { useEffect, useMemo, useRef, useState } from "react";
import {
  currentSunForDate,
  getBuildingCorners,
  shadowPolygonForBuilding,
  shadowVector,
} from "../utils/solar";

function getSceneBounds(buildings, targetArea) {
  const items = buildings.flatMap((building) => getBuildingCorners(building));
  const lotPoints = [
    [targetArea.x - targetArea.width / 2, targetArea.y - targetArea.depth / 2],
    [targetArea.x + targetArea.width / 2, targetArea.y + targetArea.depth / 2],
  ];
  const points = items.concat(lotPoints);
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return {
    minX: Math.min(...xs, -60),
    maxX: Math.max(...xs, 60),
    minY: Math.min(...ys, -60),
    maxY: Math.max(...ys, 60),
  };
}

function toCanvas(point, bounds, width, height) {
  const padding = 30;
  const spanX = bounds.maxX - bounds.minX || 1;
  const spanY = bounds.maxY - bounds.minY || 1;
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  return {
    x: padding + (point[0] - bounds.minX) * scale,
    y: height - padding - (point[1] - bounds.minY) * scale,
    scale,
  };
}

function drawPolygon(ctx, points, bounds, width, height, style) {
  if (!points.length) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    const canvasPoint = toCanvas(point, bounds, width, height);
    if (index === 0) ctx.moveTo(canvasPoint.x, canvasPoint.y);
    else ctx.lineTo(canvasPoint.x, canvasPoint.y);
  });
  ctx.closePath();
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth ?? 1;
  ctx.stroke();
}

export function PlanCanvas({
  buildings,
  selectedId,
  setSelectedId,
  setBuildings,
  targetArea,
  date,
  latitude,
  timeValue,
  addManualBuilding,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [isAddMode, setIsAddMode] = useState(false);

  const sun = useMemo(() => currentSunForDate(date, latitude, timeValue), [date, latitude, timeValue]);
  const bounds = useMemo(() => getSceneBounds(buildings, targetArea), [buildings, targetArea]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#12131a";
    ctx.fillRect(0, 0, width, height);

    const lotCorners = [
      [targetArea.x - targetArea.width / 2, targetArea.y - targetArea.depth / 2],
      [targetArea.x + targetArea.width / 2, targetArea.y - targetArea.depth / 2],
      [targetArea.x + targetArea.width / 2, targetArea.y + targetArea.depth / 2],
      [targetArea.x - targetArea.width / 2, targetArea.y + targetArea.depth / 2],
    ];

    drawPolygon(ctx, lotCorners, bounds, width, height, {
      fill: "rgba(245, 158, 11, 0.12)",
      stroke: "#f59e0b",
      lineWidth: 2,
    });

    buildings.forEach((building) => {
      const shadow = shadowPolygonForBuilding(building, sun);
      if (shadow.length) {
        drawPolygon(ctx, shadow, bounds, width, height, {
          fill: "rgba(15, 23, 42, 0.52)",
          stroke: "rgba(15, 23, 42, 0.22)",
        });
      }
    });

    buildings.forEach((building) => {
      const corners = getBuildingCorners(building);
      drawPolygon(ctx, corners, bounds, width, height, {
        fill: building.source === "public_data" ? "rgba(94, 234, 212, 0.2)" : "rgba(245, 158, 11, 0.26)",
        stroke: building.id === selectedId ? "#f8fafc" : "#4fd1c5",
        lineWidth: building.id === selectedId ? 2.5 : 1.2,
      });

      const center = toCanvas([building.x, building.y], bounds, width, height);
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "600 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(building.name, center.x, center.y);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText(`${building.height}m`, center.x, center.y + 14);
    });

    if (sun.isDay) {
      const sunVector = shadowVector(sun, 20);
      const origin = toCanvas([targetArea.x, targetArea.y], bounds, width, height);
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(origin.x - sunVector.x, origin.y + sunVector.y);
      ctx.stroke();
    }
  }, [bounds, buildings, date, latitude, selectedId, sun, targetArea]);

  const translatePointer = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const padding = 30;
    const spanX = bounds.maxX - bounds.minX || 1;
    const spanY = bounds.maxY - bounds.minY || 1;
    const scale = Math.min((canvas.width - padding * 2) / spanX, (canvas.height - padding * 2) / spanY);

    return {
      x: bounds.minX + (x - padding) / scale,
      y: bounds.minY + (canvas.height - y - padding) / scale,
    };
  };

  const findBuilding = (pointer) =>
    [...buildings]
      .reverse()
      .find((building) => {
        const halfWidth = building.width / 2;
        const halfDepth = building.depth / 2;
        return (
          pointer.x >= building.x - halfWidth &&
          pointer.x <= building.x + halfWidth &&
          pointer.y >= building.y - halfDepth &&
          pointer.y <= building.y + halfDepth
        );
      });

  return (
    <section className="panel canvas-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">2D 시뮬레이션</p>
          <h3>실시간 그림자 평면도</h3>
        </div>
        <div className="toolbar">
          <button className={isAddMode ? "secondary-button active" : "secondary-button"} onClick={() => setIsAddMode((value) => !value)}>
            신축 건물 추가
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={560}
        className="plan-canvas"
        onMouseDown={(event) => {
          const pointer = translatePointer(event);
          if (isAddMode) {
            addManualBuilding(pointer);
            setIsAddMode(false);
            return;
          }

          const building = findBuilding(pointer);
          if (!building) {
            setSelectedId("");
            return;
          }

          setSelectedId(building.id);
          if (building.source !== "manual") return;
          dragRef.current = {
            id: building.id,
            offsetX: pointer.x - building.x,
            offsetY: pointer.y - building.y,
          };
        }}
        onMouseMove={(event) => {
          if (!dragRef.current) return;
          const pointer = translatePointer(event);
          setBuildings((current) =>
            current.map((building) =>
              building.id === dragRef.current.id
                ? {
                    ...building,
                    x: Math.round((pointer.x - dragRef.current.offsetX) * 10) / 10,
                    y: Math.round((pointer.y - dragRef.current.offsetY) * 10) / 10,
                  }
                : building,
            ),
          );
        }}
        onMouseUp={() => {
          dragRef.current = null;
        }}
        onMouseLeave={() => {
          dragRef.current = null;
        }}
      />
    </section>
  );
}
