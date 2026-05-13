import { NextResponse } from "next/server";
import { getServerBrowserId, createSignedBrowserId } from "@/lib/browser-id-server";

export async function POST() {
  // Check if already has valid browser ID
  const existing = await getServerBrowserId();
  if (existing) {
    return NextResponse.json({ browserId: existing });
  }

  // Generate new browser ID and sign it
  const browserId = crypto.randomUUID();
  await createSignedBrowserId(browserId);

  return NextResponse.json({ browserId });
}

export async function GET() {
  const browserId = await getServerBrowserId();
  if (!browserId) {
    return NextResponse.json({ browserId: null });
  }
  return NextResponse.json({ browserId });
}
