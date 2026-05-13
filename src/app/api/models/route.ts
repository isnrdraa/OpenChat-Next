import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  // Require admin auth to list models
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ models: [] });
  }

  const settings = await prisma.appSettings.findFirst({
    where: { setupCompleted: true },
  });

  if (!settings) {
    return NextResponse.json({ models: [] });
  }

  try {
    const url = `${settings.providerBaseUrl.replace(/\/$/, "")}/models`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${settings.providerApiKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ models: [] });
    }

    const data = await res.json();
    const models = (data.data || []).map((m: { id: string }) => m.id);

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ models: [] });
  }
}
