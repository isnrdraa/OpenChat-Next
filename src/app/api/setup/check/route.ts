import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst({
      where: { setupCompleted: true },
    });

    return NextResponse.json({
      completed: !!settings,
      siteName: settings?.siteName || "OpenChat",
    });
  } catch {
    return NextResponse.json({ completed: false, siteName: "OpenChat" });
  }
}
