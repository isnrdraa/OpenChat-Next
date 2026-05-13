import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getServerBrowserId } from "@/lib/browser-id-server";
import { chatCompletion, ChatMessage } from "@/lib/provider";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ),
  sessionId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 20 messages per minute per IP
    const ip = getClientIp(request);
    const limit = rateLimit(`chat:${ip}`, {
      maxAttempts: 20,
      windowMs: 60 * 1000,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak request. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) },
        }
      );
    }

    const body = await request.json();
    const data = chatSchema.parse(body);

    // Get provider config
    const settings = await prisma.appSettings.findFirst({
      where: { setupCompleted: true },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "App not configured" },
        { status: 500 }
      );
    }

    // Build messages with system prompt
    const messages: ChatMessage[] = [
      { role: "system", content: settings.systemPrompt },
      ...data.messages,
    ];

    // Determine identity: admin session or browserId
    const session = await getSession();
    const browserId = await getServerBrowserId();

    // Save user message to DB if sessionId provided
    if (data.sessionId) {
      const lastUserMsg = data.messages[data.messages.length - 1];
      if (lastUserMsg && lastUserMsg.role === "user") {
        // Verify session ownership
        const chatSession = await prisma.chatSession.findFirst({
          where: {
            id: data.sessionId,
            ...(session ? { userId: session.userId } : { browserId: browserId || "" }),
          },
        });

        if (chatSession) {
          await prisma.message.create({
            data: {
              sessionId: data.sessionId,
              role: "user",
              content: lastUserMsg.content,
            },
          });
        }
      }
    }

    // Stream from provider
    const stream = await chatCompletion(
      {
        baseUrl: settings.providerBaseUrl,
        apiKey: settings.providerApiKey,
        model: settings.providerModel,
      },
      messages
    );

    // Collect full response for DB save, while streaming to client
    const decoder = new TextDecoder();
    let fullContent = "";

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullContent += extractContent(chunk);
            controller.enqueue(value);
          }

          // Save assistant message after stream completes
          if (data.sessionId && fullContent) {
            const chatSession = await prisma.chatSession.findFirst({
              where: {
                id: data.sessionId,
                ...(session ? { userId: session.userId } : { browserId: browserId || "" }),
              },
            });

            if (chatSession) {
              await prisma.message.create({
                data: {
                  sessionId: data.sessionId,
                  role: "assistant",
                  content: fullContent,
                },
              });
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractContent(chunk: string): string {
  let content = "";
  const lines = chunk.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("data: ")) continue;

    const data = trimmed.slice(6);
    if (data === "[DONE]") continue;

    try {
      const parsed = JSON.parse(data);
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) content += delta;
    } catch {
      // Skip malformed lines
    }
  }

  return content;
}
