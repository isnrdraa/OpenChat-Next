import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const testSchema = z.object({
  providerId: z.string().optional(),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  model: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = testSchema.parse(body);

    // If apiKey is "existing" or blank, use provider stored in DB
    let apiKey = data.apiKey;
    if (!apiKey || apiKey === "existing") {
      if (data.providerId) {
        const provider = await prisma.providerConfig.findUnique({
          where: { id: data.providerId },
        });
        if (!provider) {
          return NextResponse.json({
            success: false,
            error: "Provider tidak ditemukan",
          });
        }
        apiKey = provider.apiKey;
      } else {
        const settings = await prisma.appSettings.findFirst({
          where: { setupCompleted: true },
        });
        if (!settings) {
          return NextResponse.json({
            success: false,
            error: "Tidak ada API key tersimpan",
          });
        }
        apiKey = settings.providerApiKey;
      }

      if (!apiKey) {
        return NextResponse.json({
          success: false,
          error: "API key tidak ada",
        });
      }
    }

    const url = `${data.baseUrl.replace(/\/$/, "")}/chat/completions`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: data.model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errorMsg = `Provider error (${res.status})`;

      if (res.status === 401 || res.status === 403) {
        errorMsg = "API key tidak valid";
      } else if (res.status === 404) {
        errorMsg = "Model tidak ditemukan";
      } else if (res.status === 429) {
        errorMsg = "Rate limit tercapai";
      } else if (text) {
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.error?.message || errorMsg;
        } catch {
          errorMsg = text.slice(0, 100);
        }
      }

      return NextResponse.json({ success: false, error: errorMsg });
    }

    const result = await res.json();
    const content = result.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      message: `Koneksi berhasil. Model merespons: "${content.slice(0, 50)}"`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Data tidak lengkap",
      });
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({
        success: false,
        error: "Provider tidak merespons (timeout 10s)",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Gagal terhubung ke provider",
    });
  }
}
