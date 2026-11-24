/**
 * Tiny localStorage-backed store for the user's name.
 * Used with React's useSyncExternalStore: the server renders "" and the client
 * reads localStorage after hydration, so there is no hydration mismatch.
 */

const KEY = "nova.userName";
const listeners = new Set<() => void>();

export function getUserName(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return ""; // private mode / storage blocked
  }
}

export function getServerUserName(): string {
  return "";
}

export function setUserName(name: string) {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 60);
  try {
    if (clean) localStorage.setItem(KEY, clean);
    else localStorage.removeItem(KEY);
  } catch {
    // ignore storage errors
  }
  listeners.forEach((l) => l());
}

export function subscribeUserName(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener(); // another tab changed it
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
