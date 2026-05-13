const BROWSER_ID_KEY = "openchat_browser_id";

export function getBrowserId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(BROWSER_ID_KEY, id);
  }

  // Also set as cookie so server can read it
  document.cookie = `browser_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

  return id;
}
