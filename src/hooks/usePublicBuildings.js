import { useEffect, useState } from "react";
import { fetchVworldBuildings } from "../utils/publicData";

export function usePublicBuildings(location) {
  const [state, setState] = useState({
    buildings: [],
    loading: false,
    error: "",
    message: "주소를 선택하면 실제 건물 데이터를 불러옵니다.",
  });

  useEffect(() => {
    if (!location?.lat || !location?.lng) return undefined;

    const controller = new AbortController();
    let active = true;
    Promise.resolve().then(() => {
      if (active) setState((prev) => ({ ...prev, buildings: [], loading: true, error: "" }));
    });

    fetchVworldBuildings({
      lat: location.lat,
      lng: location.lng,
      signal: controller.signal,
    })
      .then((result) => {
        if (!active) return;
        setState({
          buildings: result.buildings,
          loading: false,
          error: "",
          message: result.message,
        });
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setState({
          buildings: [],
          loading: false,
          error: error.message,
          message: "실시간 건물 데이터를 불러오지 못해 수동 모드로 전환했습니다.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [location?.lat, location?.lng]);

  return state;
}
