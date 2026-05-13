export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderConfig {
  id?: string;
  name?: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled?: boolean;
  isPrimary?: boolean;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamChat(
  config: ProviderConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
) {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    callbacks.onError(new Error(`Provider error ${res.status}: ${text}`));
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("No response body"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            callbacks.onToken(content);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    callbacks.onDone();
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function chatCompletion(
  configs: ProviderConfig[],
  messages: ChatMessage[]
): Promise<ReadableStream> {
  let lastError: Error = new Error("No provider available");

  for (const config of configs) {
    if (config.enabled === false) continue;

    try {
      return await streamFromProvider(config, messages);
    } catch (error) {
      if (error instanceof ProviderAttemptError && error.retryable) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

class ProviderAttemptError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "ProviderAttemptError";
    this.retryable = retryable;
  }
}

async function streamFromProvider(
  config: ProviderConfig,
  messages: ChatMessage[]
): Promise<ReadableStream> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
      }),
    });
  } catch (error) {
    throw new ProviderAttemptError(
      error instanceof Error ? error.message : String(error),
      true
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ProviderAttemptError(
      `Provider error ${res.status}: ${text}`,
      isRetryableStatus(res.status)
    );
  }

  if (!res.body) {
    throw new ProviderAttemptError("No response body", true);
  }

  return res.body;
}

function isRetryableStatus(status: number) {
  return status >= 500 || status === 408 || status === 425 || status === 429;
}
