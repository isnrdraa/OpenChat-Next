const BROWSER_ID_KEY = "openchat_browser_id";

/**
 * Client-side: initialize browser identity.
 * Calls server to register/validate browser ID with HMAC signature.
 * The actual cookie is httpOnly and set by the server.
 */
export async function initBrowserId(): Promise<string> {
  // Check if we already have a local reference
  const stored = localStorage.getItem(BROWSER_ID_KEY);

  // Verify with server (server checks httpOnly signed cookie)
  const res = await fetch("/api/browser");
  const data = await res.json();

  if (data.browserId) {
    localStorage.setItem(BROWSER_ID_KEY, data.browserId);
    return data.browserId;
  }

  // No valid server cookie - register new one
  const registerRes = await fetch("/api/browser", { method: "POST" });
  const registerData = await registerRes.json();

  if (registerData.browserId) {
    localStorage.setItem(BROWSER_ID_KEY, registerData.browserId);
    return registerData.browserId;
  }

  // Fallback (should not happen)
  return stored || "";
}

export function getLocalBrowserId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(BROWSER_ID_KEY) || "";
}
