const KEY_PREFIX = "wordex-musikkryss:";

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function clearKey(key: string) {
  try {
    localStorage.removeItem(KEY_PREFIX + key);
  } catch {
    // ignore
  }
}
