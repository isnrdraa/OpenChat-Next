import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.appSettings.findFirst({
    where: { setupCompleted: true },
  });

  if (!settings) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
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
