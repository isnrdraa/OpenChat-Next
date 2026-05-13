"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Copy, Check } from "lucide-react";
import { MarkdownContent } from "@/components/markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatAreaProps {
  sessionId: string | null;
  onSessionCreated?: (id: string, title: string) => void;
}

function CopyResponseButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="mt-1 p-1 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      aria-label="Copy response"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function ChatArea({ sessionId, onSessionCreated }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessionId
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external sessionId changes
  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  // Load messages when session changes
  const loadMessages = useCallback(async () => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${currentSessionId}`);
      if (res.ok) {
        const data = await res.json();
        const msgs = (data.session.messages || []).map(
          (m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })
        );
        setMessages(msgs);
      }
    } catch {
      // Ignore
    }
  }, [currentSessionId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  async function handleSend() {
    const content = input.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Add placeholder for assistant
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    let activeSessionId = currentSessionId;

    // Auto-create session if none exists
    if (!activeSessionId) {
      try {
        const title =
          content.length > 50 ? content.slice(0, 50) + "..." : content;
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          const data = await res.json();
          activeSessionId = data.session.id;
          setCurrentSessionId(activeSessionId);
          if (onSessionCreated) {
            onSessionCreated(data.session.id, title);
          }
        }
      } catch {
        // Continue without session
      }
    } else if (messages.length === 0 && onSessionCreated) {
      const title =
        content.length > 50 ? content.slice(0, 50) + "..." : content;
      try {
        await fetch(`/api/sessions/${activeSessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        onSessionCreated(activeSessionId, title);
      } catch {
        // Ignore
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          sessionId: activeSessionId,
        }),
      });

      if (!res.ok) {
        let errorMsg = "Request failed";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          // ignore
        }
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Error: ${errorMsg}` },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              assistantContent += token;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantContent },
              ]);
            }
          } catch {
            // Skip malformed
          }
        }
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error: Network request failed" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
              <div className="text-center">
                <h2 className="text-lg font-medium text-foreground mb-1">
                  Mulai percakapan
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ketik pesan untuk memulai
                </p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-md"
                      : "bg-secondary text-foreground border border-border rounded-bl-md"
                  }`}
                >
                  {msg.content ? (
                    msg.role === "assistant" ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )
                  ) : loading && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:300ms]" />
                    </span>
                  ) : null}
                </div>
                {/* Copy button for assistant messages */}
                {msg.role === "assistant" && msg.content && !loading && (
                  <CopyResponseButton content={msg.content} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end bg-secondary border border-border rounded-2xl px-4 py-3 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[160px] leading-relaxed"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="ml-2 p-1.5 rounded-lg bg-accent text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
