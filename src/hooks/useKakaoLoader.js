import { useEffect, useState } from "react";

export function useKakaoLoader() {
  const [status, setStatus] = useState(() => {
    if (typeof window === "undefined") return "idle";
    if (window.kakao?.maps?.services) return "ready";
    if (!import.meta.env.VITE_KAKAO_API_KEY) return "missing-key";
    return "loading";
  });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_API_KEY;
    if (!apiKey || window.kakao?.maps?.services) return;

    const existing = document.querySelector("script[data-kakao-maps='true']");
    if (existing) {
      const handleExistingLoad = () => {
        window.kakao.maps.load(() => setStatus("ready"));
      };
      existing.addEventListener("load", handleExistingLoad);
      return () => existing.removeEventListener("load", handleExistingLoad);
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.kakaoMaps = "true";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=${apiKey}`;
    script.onload = () => {
      window.kakao.maps.load(() => setStatus("ready"));
    };
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);
  }, []);

  return {
    isReady: status === "ready",
    status,
  };
}
