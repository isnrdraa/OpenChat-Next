import { cookies } from "next/headers";

const BROWSER_COOKIE = "browser_id";
const BROWSER_SIG_COOKIE = "browser_sig";

/**
 * Server-side: get and validate browser ID from cookies.
 * Returns null if browser_id is missing or signature is invalid.
 */
export async function getServerBrowserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const browserId = cookieStore.get(BROWSER_COOKIE)?.value;
  const sig = cookieStore.get(BROWSER_SIG_COOKIE)?.value;

  if (!browserId || !sig) return null;

  // Verify signature
  const expectedSig = await signBrowserId(browserId);
  if (sig !== expectedSig) return null;

  return browserId;
}

/**
 * Server-side: create a signed browser ID cookie.
 * Called when a new browser_id is registered.
 */
export async function createSignedBrowserId(browserId: string) {
  const sig = await signBrowserId(browserId);
  const cookieStore = await cookies();

  cookieStore.set(BROWSER_COOKIE, browserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  cookieStore.set(BROWSER_SIG_COOKIE, sig, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

async function signBrowserId(browserId: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || "fallback";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(browserId)
  );
  return Buffer.from(signature).toString("hex");
}
