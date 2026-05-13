import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getServerBrowserId } from "@/lib/browser-id-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const browserId = await getServerBrowserId();

  if (!session && !browserId) {
    return NextResponse.json({ error: "No identity" }, { status: 400 });
  }

  const { id } = await params;

  const chatSession = await prisma.chatSession.findFirst({
    where: {
      id,
      ...(session ? { userId: session.userId } : { browserId: browserId || "" }),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ session: chatSession });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const browserId = await getServerBrowserId();

  if (!session && !browserId) {
    return NextResponse.json({ error: "No identity" }, { status: 400 });
  }

  const { id } = await params;
  const body = await request.json();

  const chatSession = await prisma.chatSession.findFirst({
    where: {
      id,
      ...(session ? { userId: session.userId } : { browserId: browserId || "" }),
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.chatSession.update({
    where: { id },
    data: { title: body.title || chatSession.title },
  });

  return NextResponse.json({ session: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const browserId = await getServerBrowserId();

  if (!session && !browserId) {
    return NextResponse.json({ error: "No identity" }, { status: 400 });
  }

  const { id } = await params;

  const chatSession = await prisma.chatSession.findFirst({
    where: {
      id,
      ...(session ? { userId: session.userId } : { browserId: browserId || "" }),
    },
  });

  if (!chatSession) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chatSession.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
