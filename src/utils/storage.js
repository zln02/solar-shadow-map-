const STORAGE_KEY = "solar-shadow-map:snapshots";

export function loadSnapshots() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSnapshot(snapshot) {
  const snapshots = loadSnapshots();
  const nextSnapshots = [
    {
      ...snapshot,
      id: snapshot.id || `snapshot-${Date.now()}`,
      createdAt: new Date().toISOString(),
    },
    ...snapshots,
  ].slice(0, 12);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshots));
  return nextSnapshots;
}

export function removeSnapshot(snapshotId) {
  const nextSnapshots = loadSnapshots().filter((snapshot) => snapshot.id !== snapshotId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshots));
  return nextSnapshots;
}

export function exportSnapshot(snapshot) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `solar-shadow-map-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
