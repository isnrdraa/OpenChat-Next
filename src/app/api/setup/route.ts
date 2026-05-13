import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const setupSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  siteName: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  providerBaseUrl: z.string().url(),
  providerApiKey: z.string().min(1),
  providerModel: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = setupSchema.parse(body);

    // Use transaction to prevent race condition
    const result = await prisma.$transaction(async (tx) => {
      // Check if already setup inside transaction
      const existing = await tx.appSettings.findFirst({
        where: { setupCompleted: true },
      });

      if (existing) {
        return { error: "Setup already completed" };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create admin user
      await tx.user.create({
        data: {
          username: data.username,
          passwordHash,
          role: "admin",
        },
      });

      // Create app settings
      await tx.appSettings.create({
        data: {
          siteName: data.siteName,
          systemPrompt: data.systemPrompt,
          providerBaseUrl: data.providerBaseUrl,
          providerApiKey: data.providerApiKey,
          providerModel: data.providerModel,
          setupCompleted: true,
        },
      });

      return { success: true };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
