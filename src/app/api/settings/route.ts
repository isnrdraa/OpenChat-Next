import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

const settingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  systemPrompt: z.string().min(1).optional(),
  providerBaseUrl: z.string().url().optional(),
  providerApiKey: z.string().min(1).optional(),
  providerModel: z.string().min(1).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.appSettings.findFirst({
    where: { setupCompleted: true },
  });

  if (!settings) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }

  return NextResponse.json({
    siteName: settings.siteName,
    systemPrompt: settings.systemPrompt,
    providerBaseUrl: settings.providerBaseUrl,
    providerModel: settings.providerModel,
    // Don't expose API key fully
    providerApiKeySet: !!settings.providerApiKey,
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = settingsSchema.parse(body);

    // Update app settings
    const settings = await prisma.appSettings.findFirst({
      where: { setupCompleted: true },
    });

    if (!settings) {
      return NextResponse.json({ error: "Not configured" }, { status: 404 });
    }

    const updateData: Record<string, string> = {};
    if (data.siteName) updateData.siteName = data.siteName;
    if (data.systemPrompt) updateData.systemPrompt = data.systemPrompt;
    if (data.providerBaseUrl) updateData.providerBaseUrl = data.providerBaseUrl;
    if (data.providerApiKey) updateData.providerApiKey = data.providerApiKey;
    if (data.providerModel) updateData.providerModel = data.providerModel;

    if (Object.keys(updateData).length > 0) {
      await prisma.appSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    // Update password if provided
    if (data.currentPassword && data.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Password lama salah" },
          { status: 400 }
        );
      }

      const newHash = await bcrypt.hash(data.newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
