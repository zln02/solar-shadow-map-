import { useMemo, useState } from "react";

export function AddressSearch({ kakaoReady, location, cities, onSelectLocation }) {
  const [query, setQuery] = useState(location.address);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState("");

  const placeholder = useMemo(
    () => (kakaoReady ? "예: 서울 강남구 역삼동 123" : "카카오 API 키 연결 후 주소 검색 사용 가능"),
    [kakaoReady],
  );
  const statusMessage =
    feedback ||
    (kakaoReady ? "실제 주소를 검색해 공터 중심점을 선택하세요." : "카카오 API 키를 연결하면 실제 주소 검색이 활성화됩니다.");

  const handleSearch = () => {
    if (!query.trim()) return;
    if (!kakaoReady) {
      setFeedback("카카오 API 키가 없어서 프리셋 도시 모드로 동작 중입니다.");
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    const places = new window.kakao.maps.services.Places();
    const merged = [];

    const commit = () => {
      if (!merged.length) {
        setFeedback("검색 결과가 없습니다. 도로명 또는 지번 주소로 다시 시도해 주세요.");
      } else {
        setResults(merged.slice(0, 6));
        setFeedback(`검색 결과 ${Math.min(merged.length, 6)}건을 확인했습니다.`);
      }
    };

    geocoder.addressSearch(query, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        merged.push(
          ...data.map((item, index) => ({
            id: `address-${index}`,
            label: item.address_name,
            road: item.road_address?.address_name || "",
            lat: Number(item.y),
            lng: Number(item.x),
          })),
        );
      }

      places.keywordSearch(query, (placeData, placeStatus) => {
        if (placeStatus === window.kakao.maps.services.Status.OK) {
          merged.push(
            ...placeData.map((item, index) => ({
              id: `keyword-${index}`,
              label: item.place_name,
              road: item.road_address_name || item.address_name,
              lat: Number(item.y),
              lng: Number(item.x),
            })),
          );
        }
        commit();
      });
    });
  };

  return (
    <div className="search-card">
      <div className="search-row">
        <div className="input-shell">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
            placeholder={placeholder}
          />
        </div>
        <button className="primary-button" onClick={handleSearch}>
          주소 검색
        </button>
      </div>

      <div className="search-meta">
        <span>{statusMessage}</span>
        <span className="search-location">
          현재 중심점 {location.address} · {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </span>
      </div>

      {results.length > 0 ? (
        <div className="search-results">
          {results.map((item) => (
            <button
              key={item.id}
              className="search-result"
              onClick={() => {
                onSelectLocation({
                  address: item.road || item.label,
                  lat: item.lat,
                  lng: item.lng,
                });
                setQuery(item.road || item.label);
                setResults([]);
                setFeedback("주소를 선택했습니다. 실제 건물 데이터를 불러오는 중입니다.");
              }}
            >
              <strong>{item.label}</strong>
              <span>{item.road}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="city-pills">
        {cities.map((city) => (
          <button
            key={city.name}
            className="pill-button"
            onClick={() =>
              onSelectLocation({
                address: city.address,
                lat: city.lat,
                lng: city.lng,
                regionKey: city.regionKey,
              })
            }
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
}
