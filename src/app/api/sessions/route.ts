import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getServerBrowserId } from "@/lib/browser-id-server";

export async function GET() {
  const session = await getSession();
  const browserId = await getServerBrowserId();

  if (!session && !browserId) {
    return NextResponse.json({ sessions: [] });
  }

  const sessions = await prisma.chatSession.findMany({
    where: session
      ? { userId: session.userId }
      : { browserId: browserId || "" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const session = await getSession();
  const browserId = await getServerBrowserId();

  if (!session && !browserId) {
    return NextResponse.json(
      { error: "No identity found" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const title = body.title || "New Chat";

  const chatSession = await prisma.chatSession.create({
    data: {
      title,
      ...(session ? { userId: session.userId } : { browserId }),
    },
  });

  return NextResponse.json({ session: chatSession });
}
